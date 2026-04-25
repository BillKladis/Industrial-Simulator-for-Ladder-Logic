from __future__ import annotations
import asyncio
import time
from typing import Any, Callable, Awaitable

from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements import build_element
from app.engine.elements.base import Element
from app.engine.elements.inputs import PushButton, HandSwitch, LimitSwitch
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

        # Build (elementId, port) → shared node from wire data.
        # A wire's `node` field is the authoritative node ID for both endpoints.
        port_node: dict[tuple[str, str], str] = {}
        for wire in data.get("wires", []):
            node = wire.get("node")
            if not node:
                continue
            for endpoint in (wire.get("from", {}), wire.get("to", {})):
                eid_ = endpoint.get("elementId")
                port_ = endpoint.get("port")
                if eid_ and port_:
                    port_node[(eid_, port_)] = node

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
