from __future__ import annotations
from typing import Any
from .base import Element


class RelayCoil(Element):
    """Standard relay coil — energized when it spans live ↔ neutral.
    Coils never conduct (they're loads), so conducts() always returns False."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}


class ThermalOverload(Element):
    """Thermal overload relay coil — trips after sustained overload.
    In simulation, trip can be triggered manually via a button_event."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False
        self.tripped: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized, "tripped": self.tripped}


class SolenoidValveCoil(Element):
    """Solenoid valve coil — behaves like a relay coil."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}
