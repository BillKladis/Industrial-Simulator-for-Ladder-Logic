from __future__ import annotations
from collections import deque
from dataclasses import dataclass, field
from typing import Any

from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements.base import Element
from app.engine.elements.coils import RelayCoil, ThermalOverload, SolenoidValveCoil
from app.engine.elements.timers import OnDelayTimer, OffDelayTimer, PulseRelay
from app.engine.elements.outputs import Lamp, Siren, Motor3Ph, MeasurementInstrument
from app.engine.elements.compound import YDStarter
from app.engine.elements.contacts import RelayContact, ThermalContact, OnDelayContact, OffDelayContact, NposContact
from app.engine.elements.inputs import NposLever


@dataclass
class SolveContext:
    """Passed to Element.update() so elements can read peer states."""

    elements: dict[str, Element] = field(default_factory=dict)
    live_nodes: set[str] = field(default_factory=set)
    neutral_nodes: set[str] = field(default_factory=set)


def _bfs(start: str, graph: CircuitGraph, conducting: set[str]) -> set[str]:
    visited: set[str] = {start}
    q: deque[str] = deque([start])
    while q:
        node = q.popleft()
        for nb in graph.neighbour_nodes(node, conducting):
            if nb not in visited:
                visited.add(nb)
                q.append(nb)
    return visited


def _load_element_ids(elements: dict[str, Element]) -> set[str]:
    """Elements that are loads (never conduct) — coils, outputs, timers."""
    load_types = (
        RelayCoil,
        ThermalOverload,
        SolenoidValveCoil,
        OnDelayTimer,
        OffDelayTimer,
        PulseRelay,
        Lamp,
        Siren,
        Motor3Ph,
        MeasurementInstrument,
        YDStarter,
        NposLever,
    )
    return {eid for eid, el in elements.items() if isinstance(el, load_types)}


def _update_contacts(elements: dict[str, Element]) -> None:
    """Push coil/timer states down into their dependent contacts."""
    for el in elements.values():
        if isinstance(el, RelayContact):
            coil = elements.get(el.coil_id)
            if coil is not None and hasattr(coil, "energized"):
                el.set_coil_state(coil.energized)
        elif isinstance(el, ThermalContact):
            overload = elements.get(el.overload_id)
            if overload is not None and isinstance(overload, ThermalOverload):
                el.set_tripped(overload.tripped)
        elif isinstance(el, OnDelayContact):
            timer = elements.get(el.timer_id)
            if timer is not None and isinstance(timer, OnDelayTimer):
                el.set_timer_done(timer.done)
        elif isinstance(el, OffDelayContact):
            timer = elements.get(el.timer_id)
            if timer is not None and isinstance(timer, OffDelayTimer):
                el.set_active(timer.output_active)
        elif isinstance(el, NposContact):
            lever = elements.get(el.lever_id)
            if lever is not None and isinstance(lever, NposLever):
                el.set_lever_position(lever.position)


def solve(
    graph: CircuitGraph,
    elements: dict[str, Element],
    max_iterations: int = 16,
) -> tuple[set[str], set[str]]:
    """Run the fixpoint BFS solver.

    Returns (live_nodes, neutral_nodes) after convergence.
    Coil/output energized flags are updated in-place on the element objects.
    """
    load_ids = _load_element_ids(elements)

    # Propagate timer/coil states into contacts first (from previous tick)
    _update_contacts(elements)

    live: set[str] = set()
    neutral: set[str] = set()

    for _ in range(max_iterations):
        # Conducting elements: those whose conducts() is True and aren't loads
        conducting = {
            eid
            for eid, el in elements.items()
            if eid not in load_ids and el.conducts()
        }

        new_live = _bfs(RAIL_R, graph, conducting)
        new_neutral = _bfs(RAIL_N, graph, conducting)

        changed = False

        # Energize loads whose terminals span live ↔ neutral
        for eid, el in elements.items():
            if eid not in load_ids:
                continue
            ta, tb = el.terminal_a, el.terminal_b
            spans = (ta in new_live and tb in new_neutral) or (
                tb in new_live and ta in new_neutral
            )
            if hasattr(el, "energized") and el.energized != spans:
                el.energized = spans
                changed = True
            elif hasattr(el, "energized"):
                pass  # no change

        # Push updated coil states into contacts and re-solve
        _update_contacts(elements)

        live = new_live
        neutral = new_neutral

        if not changed:
            break

    return live, neutral


def tick(
    graph: CircuitGraph,
    elements: dict[str, Element],
    dt: float,
    max_iterations: int = 16,
) -> dict[str, Any]:
    """One full simulation tick. Returns the state delta for the WebSocket."""
    live, neutral = solve(graph, elements, max_iterations)

    ctx = SolveContext(elements=elements, live_nodes=live, neutral_nodes=neutral)
    for el in elements.values():
        el.update(dt, ctx)

    element_states = {eid: el.get_state() for eid, el in elements.items()}

    return {
        "type": "tick",
        "liveNodes": list(live),
        "elements": element_states,
    }
