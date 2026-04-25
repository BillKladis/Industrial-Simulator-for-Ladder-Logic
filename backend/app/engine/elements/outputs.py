from __future__ import annotations
from typing import Any
from .base import Element


class Lamp(Element):
    """Indicator lamp — display-only load."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}


class Siren(Element):
    """Siren / horn — display-only load."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}


class Motor3Ph(Element):
    """Three-phase motor — display-only. Shows running animation when energized."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}


class MeasurementInstrument(Element):
    """Measurement instrument — display-only."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.energized: bool = False

    def conducts(self) -> bool:
        return False

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized}
