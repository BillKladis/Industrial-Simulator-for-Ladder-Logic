from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

RAIL_R = "__R__"
RAIL_N = "__N__"


@dataclass
class CircuitGraph:
    """Flat representation of a circuit: nodes (junctions) and elements (edges)."""

    # node_id → set of element_ids attached to it
    adjacency: dict[str, set[str]] = field(default_factory=dict)
    # element_id → (terminal_a, terminal_b)
    element_terminals: dict[str, tuple[str, str]] = field(default_factory=dict)

    def add_node(self, node_id: str) -> None:
        self.adjacency.setdefault(node_id, set())

    def add_element(self, element_id: str, terminal_a: str, terminal_b: str) -> None:
        self.add_node(terminal_a)
        self.add_node(terminal_b)
        self.adjacency[terminal_a].add(element_id)
        self.adjacency[terminal_b].add(element_id)
        self.element_terminals[element_id] = (terminal_a, terminal_b)

    def remove_element(self, element_id: str) -> None:
        if element_id not in self.element_terminals:
            return
        ta, tb = self.element_terminals.pop(element_id)
        self.adjacency[ta].discard(element_id)
        self.adjacency[tb].discard(element_id)

    def neighbour_nodes(self, node_id: str, conducting_element_ids: set[str]) -> set[str]:
        """All nodes reachable from node_id via a single conducting element."""
        result: set[str] = set()
        for eid in self.adjacency.get(node_id, set()):
            if eid not in conducting_element_ids:
                continue
            ta, tb = self.element_terminals[eid]
            result.add(tb if ta == node_id else ta)
        return result

    @classmethod
    def from_circuit_data(cls, data: dict[str, Any]) -> "CircuitGraph":
        """Build graph from frontend JSON (elements + wires)."""
        g = cls()
        # Rails are implicit nodes
        g.add_node(RAIL_R)
        g.add_node(RAIL_N)
        for el in data.get("elements", []):
            ports = el.get("ports", {})
            ta = ports.get("a", f"{el['id']}_a")
            tb = ports.get("b", f"{el['id']}_b")
            g.add_element(el["id"], ta, tb)
        return g
