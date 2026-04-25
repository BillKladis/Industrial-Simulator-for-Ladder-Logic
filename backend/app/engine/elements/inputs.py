from __future__ import annotations
from typing import Any
from .base import Element


class PushButton(Element):
    """Momentary push button. NO = conducts when pressed; NC = conducts when NOT pressed."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.is_pressed: bool = False
        self._normally_open: bool = params.get("normally_open", True)

    def conducts(self) -> bool:
        return self.is_pressed if self._normally_open else not self.is_pressed

    def get_state(self) -> dict[str, Any]:
        return {"pressed": self.is_pressed, "energized": self.conducts()}


class HandSwitch(Element):
    """Maintained switch — state persists until toggled."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.is_on: bool = params.get("default_on", False)
        self._normally_open: bool = params.get("normally_open", True)

    def conducts(self) -> bool:
        return self.is_on if self._normally_open else not self.is_on

    def get_state(self) -> dict[str, Any]:
        return {"on": self.is_on, "energized": self.conducts()}


class LimitSwitch(Element):
    """Limit switch driven externally (e.g. mechanical actuation)."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.is_actuated: bool = False
        self._normally_open: bool = params.get("normally_open", True)

    def conducts(self) -> bool:
        return self.is_actuated if self._normally_open else not self.is_actuated

    def get_state(self) -> dict[str, Any]:
        return {"actuated": self.is_actuated, "energized": self.conducts()}


class NposLever(Element):
    """N-position rotary selector / dial.

    Coil-like: never conducts current directly.  NposContact elements reference
    it by ID and close when the lever is at their configured position.
    Each button_event (toggle=True) advances the position by one step.
    """

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.positions: int = max(2, int(params.get("positions", 3)))
        self.position: int = 0

    def conducts(self) -> bool:
        return False

    def advance(self) -> None:
        self.position = (self.position + 1) % self.positions

    def get_state(self) -> dict[str, Any]:
        return {"position": self.position, "energized": False}
