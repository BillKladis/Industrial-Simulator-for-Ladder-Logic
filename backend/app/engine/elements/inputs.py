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
