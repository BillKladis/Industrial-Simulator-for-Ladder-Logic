"""Integration test: Start/Stop holding (seal-in) circuit."""
import pytest
from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements import build_element
from app.engine.solver import solve


def _build_holding_circuit():
    """
    R ── fuse ── stop_NC ──┬── start_NO ──┬── coil ── N
                           └── C_NO       ┘

    C_NO is a NO contact linked to `coil`.
    """
    graph = CircuitGraph()
    graph.add_node(RAIL_R)
    graph.add_node(RAIL_N)

    elements_cfg = [
        {"id": "fuse", "type": "fuse", "a": RAIL_R, "b": "n1"},
        {"id": "stop", "type": "push_button_nc", "a": "n1", "b": "n2"},
        {"id": "start", "type": "push_button_no", "a": "n2", "b": "n3"},
        {"id": "c_contact", "type": "relay_contact_no", "a": "n2", "b": "n3",
         "params": {"coil_id": "coil"}},
        {"id": "coil", "type": "relay_coil", "a": "n3", "b": RAIL_N},
    ]
    elements = {}
    for cfg in elements_cfg:
        eid = cfg["id"]
        el = build_element(eid, cfg["type"], cfg["a"], cfg["b"], cfg.get("params", {}))
        elements[eid] = el
        graph.add_element(eid, cfg["a"], cfg["b"])

    return graph, elements


def test_initial_state_off():
    graph, elements = _build_holding_circuit()
    live, _ = solve(graph, elements)
    assert elements["coil"].energized is False


def test_pressing_start_energizes_coil():
    graph, elements = _build_holding_circuit()
    elements["start"].is_pressed = True
    live, _ = solve(graph, elements)
    assert elements["coil"].energized is True
    assert "n3" in live


def test_releasing_start_holds_via_seal_in():
    graph, elements = _build_holding_circuit()
    # Press start
    elements["start"].is_pressed = True
    solve(graph, elements)
    # Release start — coil should stay on via C_contact
    elements["start"].is_pressed = False
    live, _ = solve(graph, elements)
    assert elements["coil"].energized is True, "Seal-in contact must hold coil energized"


def test_pressing_stop_de_energizes():
    graph, elements = _build_holding_circuit()
    # Start and seal in
    elements["start"].is_pressed = True
    solve(graph, elements)
    elements["start"].is_pressed = False
    solve(graph, elements)
    # Press stop (NC opens)
    elements["stop"].is_pressed = True
    live, _ = solve(graph, elements)
    assert elements["coil"].energized is False
    assert "n3" not in live


def test_restart_after_stop():
    graph, elements = _build_holding_circuit()
    elements["start"].is_pressed = True
    solve(graph, elements)
    elements["start"].is_pressed = False
    solve(graph, elements)
    elements["stop"].is_pressed = True
    solve(graph, elements)
    elements["stop"].is_pressed = False
    # Press start again
    elements["start"].is_pressed = True
    live, _ = solve(graph, elements)
    assert elements["coil"].energized is True
