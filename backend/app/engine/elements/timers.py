from __future__ import annotations
from typing import Any, TYPE_CHECKING
from .base import Element

if TYPE_CHECKING:
    from app.engine.solver import SolveContext


class OnDelayTimer(Element):
    """ON-delay timer coil. When energized, waits `delay` seconds then marks `done`.
    Resets immediately on de-energize."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.delay: float = float(params.get("delay", 5.0))
        self.energized: bool = False
        self.done: bool = False
        self._elapsed: float = 0.0

    def conducts(self) -> bool:
        return False

    def update(self, dt: float, ctx: "SolveContext") -> None:
        if self.energized:
            self._elapsed += dt
            if self._elapsed >= self.delay:
                self.done = True
        else:
            self._elapsed = 0.0
            self.done = False

    def get_state(self) -> dict[str, Any]:
        return {
            "energized": self.energized,
            "done": self.done,
            "elapsed": round(self._elapsed, 3),
            "remaining": round(max(0.0, self.delay - self._elapsed), 3),
        }


class OffDelayTimer(Element):
    """OFF-delay timer coil. Output stays active for `delay` seconds after input de-energizes."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.delay: float = float(params.get("delay", 5.0))
        self.energized: bool = False
        self.output_active: bool = False
        self._hold_elapsed: float = 0.0
        self._was_energized: bool = False

    def conducts(self) -> bool:
        return False

    def update(self, dt: float, ctx: "SolveContext") -> None:
        if self.energized:
            self.output_active = True
            self._hold_elapsed = 0.0
        else:
            if self._was_energized:
                # falling edge: start hold timer
                self._hold_elapsed = 0.0
            if self.output_active:
                self._hold_elapsed += dt
                if self._hold_elapsed >= self.delay:
                    self.output_active = False
        self._was_energized = self.energized

    def get_state(self) -> dict[str, Any]:
        return {
            "energized": self.energized,
            "output_active": self.output_active,
            "remaining": round(max(0.0, self.delay - self._hold_elapsed), 3),
        }


class PulseRelay(Element):
    """Pulse relay — emits a single-tick pulse on each OFF→ON transition."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.pulse_duration: float = float(params.get("pulse_duration", 0.1))
        self.energized: bool = False
        self.pulsing: bool = False
        self._pulse_elapsed: float = 0.0
        self._prev_energized: bool = False

    def conducts(self) -> bool:
        return False

    def update(self, dt: float, ctx: "SolveContext") -> None:
        rising_edge = self.energized and not self._prev_energized
        if rising_edge:
            self.pulsing = True
            self._pulse_elapsed = 0.0
        if self.pulsing:
            self._pulse_elapsed += dt
            if self._pulse_elapsed >= self.pulse_duration:
                self.pulsing = False
        self._prev_energized = self.energized

    def get_state(self) -> dict[str, Any]:
        return {"energized": self.energized, "pulsing": self.pulsing}
