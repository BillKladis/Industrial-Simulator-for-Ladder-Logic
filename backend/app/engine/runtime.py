from __future__ import annotations
import asyncio
import time
from typing import Any, Callable, Awaitable

from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements import build_element
from app.engine.elements.base import Element
from app.engine.elements.inputs import PushButton, HandSwitch, LimitSwitch, NposLever
from app.engine.elements.coils import ThermalOverload
from app.engine.solver import tick as solver_tick
from app.config import settings


class SimulationRuntime:
    """Async tick loop for one circuit session."""

    def __init__(
        self,
        circuit_data: dict[str, Any],
        on_tick: Callable[[dict[str, Any]], Awaitable[None]],
    ):
        self._on_tick = on_tick
        self._running = False
        self._task: asyncio.Task | None = None
        self._elements: dict[str, Element] = {}
        self._graph = CircuitGraph()
        self._load_circuit(circuit_data)

    # ------------------------------------------------------------------
    # Circuit loading
    # ------------------------------------------------------------------

    def _load_circuit(self, data: dict[str, Any]) -> None:
        self._graph = CircuitGraph()
        self._graph.add_node(RAIL_R)
        self._graph.add_node(RAIL_N)
        self._elements = {}

        # Build (elementId, port) → shared node using union-find.
        #
        # Each wire's `node` field names the electrical node shared by its two
        # endpoints.  When multiple wires touch the same element port (parallel
        # branches) their node IDs must be merged.  Union-Find does this correctly
        # while preserving RAIL_R/RAIL_N as roots.

        # Collect all wire-node values that touch each (elementId, port) pair.
        port_wire_nodes: dict[tuple[str, str], list[str]] = {}
        for wire in data.get("wires", []):
            wire_node = wire.get("node")
            if not wire_node:
                continue
            for ep in (wire.get("from", {}), wire.get("to", {})):
                eid_ = ep.get("elementId", "")
                port_ = ep.get("port", "")
                if eid_ and port_:
                    port_wire_nodes.setdefault((eid_, port_), []).append(wire_node)

        # Union-Find on the set of wire-node IDs.
        _parent: dict[str, str] = {RAIL_R: RAIL_R, RAIL_N: RAIL_N}

        def _find(x: str) -> str:
            if x not in _parent:
                _parent[x] = x
            if _parent[x] != x:
                _parent[x] = _find(_parent[x])
            return _parent[x]

        def _union(a: str, b: str) -> None:
            ra, rb = _find(a), _find(b)
            if ra == rb:
                return
            # Rail nodes are always the canonical root.
            if rb in (RAIL_R, RAIL_N):
                _parent[ra] = rb
            elif ra in (RAIL_R, RAIL_N):
                _parent[rb] = ra
            else:
                _parent[rb] = ra

        # Merge nodes that share an element port (parallel wires at the same pin).
        for nodes in port_wire_nodes.values():
            for i in range(1, len(nodes)):
                _union(nodes[0], nodes[i])

        # Rail elements force all their wires onto RAIL_R / RAIL_N.
        for el_data in data.get("elements", []):
            etype = el_data.get("type", "")
            if etype not in ("rail_r", "rail_n"):
                continue
            canonical = RAIL_R if etype == "rail_r" else RAIL_N
            eid_ = el_data.get("id", "")
            for port_ in ("a", "b"):
                for wn in port_wire_nodes.get((eid_, port_), []):
                    _union(wn, canonical)

        # Final lookup: canonical node for each (elementId, port).
        port_node: dict[tuple[str, str], str] = {
            k: _find(nodes[0]) for k, nodes in port_wire_nodes.items()
        }

        for el_data in data.get("elements", []):
            eid = el_data["id"]
            etype = el_data["type"]
            ports = el_data.get("ports", {})
            params = el_data.get("params", {})

            # Rails always bind to the power bus regardless of wire topology
            if etype == "rail_r":
                ta = tb = RAIL_R
            elif etype == "rail_n":
                ta = tb = RAIL_N
            else:
                # Wire connections override the element's own port node IDs
                ta = port_node.get((eid, "a"), ports.get("a", f"{eid}_a"))
                tb = port_node.get((eid, "b"), ports.get("b", f"{eid}_b"))

            try:
                el = build_element(eid, etype, ta, tb, params)
                self._elements[eid] = el
                self._graph.add_element(eid, ta, tb)
            except ValueError:
                pass  # unknown type — skip silently

    def reload(self, circuit_data: dict[str, Any]) -> None:
        self._load_circuit(circuit_data)

    # ------------------------------------------------------------------
    # Event handling
    # ------------------------------------------------------------------

    def handle_event(self, event: dict[str, Any]) -> None:
        etype = event.get("type")
        eid = event.get("elementId", "")
        el = self._elements.get(eid)
        if el is None:
            return

        if etype == "button_event":
            pressed = bool(event.get("pressed", False))
            if isinstance(el, PushButton):
                el.is_pressed = pressed
            elif isinstance(el, HandSwitch):
                if event.get("toggle"):
                    el.is_on = not el.is_on
                else:
                    el.is_on = pressed
            elif isinstance(el, LimitSwitch):
                el.is_actuated = pressed
            elif isinstance(el, NposLever):
                el.advance()

        elif etype == "advance_lever":
            if isinstance(el, NposLever):
                el.advance()

        elif etype == "trip_overload":
            if isinstance(el, ThermalOverload):
                el.tripped = not el.tripped

        elif etype == "blow_fuse":
            if hasattr(el, "blown"):
                el.blown = True

        elif etype == "reset_fuse":
            if hasattr(el, "blown"):
                el.blown = False

    # ------------------------------------------------------------------
    # Run loop
    # ------------------------------------------------------------------

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self) -> None:
        interval = 1.0 / settings.tick_rate_hz
        last = time.monotonic()
        while self._running:
            now = time.monotonic()
            dt = now - last
            last = now

            result = solver_tick(
                self._graph,
                self._elements,
                dt,
                settings.max_fixpoint_iterations,
            )
            result["t"] = round(now, 3)

            await self._on_tick(result)

            elapsed = time.monotonic() - now
            sleep_time = max(0.0, interval - elapsed)
            await asyncio.sleep(sleep_time)
