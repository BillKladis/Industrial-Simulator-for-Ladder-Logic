from __future__ import annotations
from typing import Any, TYPE_CHECKING
from .base import Element

if TYPE_CHECKING:
    from app.engine.solver import SolveContext


class RelayContact(Element):
    """Contact driven by a relay coil (NO or NC)."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.coil_id: str = params.get("coil_id", "")
        self._normally_open: bool = params.get("normally_open", True)
        self._coil_energized: bool = False

    def set_coil_state(self, energized: bool) -> None:
        self._coil_energized = energized

    def conducts(self) -> bool:
        return self._coil_energized if self._normally_open else not self._coil_energized

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.conducts(), "coil_energized": self._coil_energized}


class ThermalContact(Element):
    """Contact driven by a thermal overload relay (trips on overload)."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.overload_id: str = params.get("overload_id", "")
        self._normally_open: bool = params.get("normally_open", True)
        self._tripped: bool = False

    def set_tripped(self, tripped: bool) -> None:
        self._tripped = tripped

    def conducts(self) -> bool:
        # Tripped = NC opens, NO closes (fault contact)
        return self._tripped if self._normally_open else not self._tripped

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.conducts(), "tripped": self._tripped}


class OnDelayContact(Element):
    """Contact that follows an ON-delay timer (closes/opens after delay)."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.timer_id: str = params.get("timer_id", "")
        self._normally_open: bool = params.get("normally_open", True)
        self._timer_done: bool = False

    def set_timer_done(self, done: bool) -> None:
        self._timer_done = done

    def conducts(self) -> bool:
        return self._timer_done if self._normally_open else not self._timer_done

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.conducts(), "timer_done": self._timer_done}


class OffDelayContact(Element):
    """Contact that follows an OFF-delay timer."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.timer_id: str = params.get("timer_id", "")
        self._normally_open: bool = params.get("normally_open", True)
        self._active: bool = False

    def set_active(self, active: bool) -> None:
        self._active = active

    def conducts(self) -> bool:
        return self._active if self._normally_open else not self._active

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.conducts(), "active": self._active}
