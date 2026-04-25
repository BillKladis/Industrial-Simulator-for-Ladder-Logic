from __future__ import annotations
from typing import Any
from .base import Element

RAIL_R = "__R__"
RAIL_N = "__N__"


class Rail(Element):
    """Power rail (R or N). Always conducts — it's a wire stub."""

    def conducts(self) -> bool:
        return True

    def get_state(self) -> dict[str, Any]:
        return {}


class Fuse(Element):
    """Fuse — conducts unless blown."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.blown: bool = False

    def conducts(self) -> bool:
        return not self.blown

    def get_state(self) -> dict[str, Any]:
        return {"blown": self.blown}


class Terminal(Element):
    """Terminal block — always conducts (it's a junction point)."""

    def conducts(self) -> bool:
        return True

    def get_state(self) -> dict[str, Any]:
        return {}


class Wire(Element):
    """Plain wire segment — always conducts."""

    def conducts(self) -> bool:
        return True

    def get_state(self) -> dict[str, Any]:
        return {}
