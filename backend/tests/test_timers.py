"""Tests for ON-delay, OFF-delay and pulse timer elements."""
import pytest
from app.engine.graph import CircuitGraph, RAIL_R, RAIL_N
from app.engine.elements import build_element
from app.engine.solver import tick as solver_tick


def _make(elements_cfg: list[dict]):
    graph = CircuitGraph()
    graph.add_node(RAIL_R)
    graph.add_node(RAIL_N)
    elements = {}
    for cfg in elements_cfg:
        eid = cfg["id"]
        el = build_element(eid, cfg["type"], cfg["a"], cfg["b"], cfg.get("params", {}))
        elements[eid] = el
        graph.add_element(eid, cfg["a"], cfg["b"])
    return graph, elements


class TestOnDelayTimer:
    def test_not_done_before_delay(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "on_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        result = solver_tick(graph, elements, dt=1.0)
        assert elements["timer"].energized is True
        assert elements["timer"].done is False

    def test_done_after_delay(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "on_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=1.0)
        solver_tick(graph, elements, dt=1.5)
        assert elements["timer"].done is True

    def test_resets_when_de_energized(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "on_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=3.0)
        assert elements["timer"].done is True
        elements["btn"].is_pressed = False
        solver_tick(graph, elements, dt=0.1)
        assert elements["timer"].done is False
        assert elements["timer"]._elapsed == 0.0


class TestOffDelayTimer:
    def test_output_active_while_energized(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "off_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=0.1)
        assert elements["timer"].output_active is True

    def test_output_stays_active_after_de_energize(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "off_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=0.1)
        elements["btn"].is_pressed = False
        solver_tick(graph, elements, dt=1.0)
        assert elements["timer"].output_active is True

    def test_output_drops_after_delay(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "timer", "type": "off_delay_timer", "a": "n1", "b": RAIL_N,
             "params": {"delay": 2.0}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=0.1)
        elements["btn"].is_pressed = False
        solver_tick(graph, elements, dt=2.5)
        assert elements["timer"].output_active is False


class TestPulseRelay:
    def test_pulse_fires_on_rising_edge(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "pulse", "type": "pulse_relay", "a": "n1", "b": RAIL_N,
             "params": {"pulse_duration": 0.5}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=0.1)
        assert elements["pulse"].pulsing is True

    def test_pulse_ends_after_duration(self):
        graph, elements = _make([
            {"id": "btn", "type": "push_button_no", "a": RAIL_R, "b": "n1"},
            {"id": "pulse", "type": "pulse_relay", "a": "n1", "b": RAIL_N,
             "params": {"pulse_duration": 0.5}},
        ])
        elements["btn"].is_pressed = True
        solver_tick(graph, elements, dt=0.1)
        solver_tick(graph, elements, dt=0.6)
        assert elements["pulse"].pulsing is False
