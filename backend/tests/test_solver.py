"""Unit tests for the BFS fixpoint solver."""
import pytest
from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements import build_element
from app.engine.solver import solve, tick


def _make_graph_and_elements(elements_cfg: list[dict]) -> tuple[CircuitGraph, dict]:
    graph = CircuitGraph()
    graph.add_node(RAIL_R)
    graph.add_node(RAIL_N)
    elements = {}
    for cfg in elements_cfg:
        eid = cfg["id"]
        ta, tb = cfg["a"], cfg["b"]
        el = build_element(eid, cfg["type"], ta, tb, cfg.get("params", {}))
        elements[eid] = el
        graph.add_element(eid, ta, tb)
    return graph, elements


class TestBasicConductance:
    def test_wire_propagates_live(self):
        graph, elements = _make_graph_and_elements([
            {"id": "w1", "type": "wire", "a": RAIL_R, "b": "n1"},
            {"id": "lamp", "type": "lamp", "a": "n1", "b": RAIL_N},
        ])
        live, _ = solve(graph, elements)
        assert "n1" in live
        assert elements["lamp"].energized is True

    def test_open_contact_blocks_current(self):
        graph, elements = _make_graph_and_elements([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "lamp", "type": "lamp", "a": "n1", "b": RAIL_N},
        ])
        live, _ = solve(graph, elements)
        assert "n1" not in live
        assert elements["lamp"].energized is False

    def test_nc_contact_conducts_by_default(self):
        graph, elements = _make_graph_and_elements([
            {"id": "btn", "type": "push_button_nc", "a": RAIL_R, "b": "n1"},
            {"id": "lamp", "type": "lamp", "a": "n1", "b": RAIL_N},
        ])
        live, _ = solve(graph, elements)
        assert "n1" in live
        assert elements["lamp"].energized is True


class TestCoilEnergization:
    def test_coil_energizes_when_rung_complete(self):
        graph, elements = _make_graph_and_elements([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "coil", "type": "relay_coil", "a": "n1", "b": RAIL_N},
        ])
        elements["btn"].is_pressed = True
        live, _ = solve(graph, elements)
        assert "n1" in live
        assert elements["coil"].energized is True

    def test_coil_de_energizes_when_button_released(self):
        graph, elements = _make_graph_and_elements([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "coil", "type": "relay_coil", "a": "n1", "b": RAIL_N},
        ])
        elements["btn"].is_pressed = True
        solve(graph, elements)
        elements["btn"].is_pressed = False
        live, _ = solve(graph, elements)
        assert "n1" not in live
        assert elements["coil"].energized is False
