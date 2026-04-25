from __future__ import annotations
from typing import Any, TYPE_CHECKING
from .base import Element

if TYPE_CHECKING:
    from app.engine.solver import SolveContext

YD_OFF = "off"
YD_STAR = "star"
YD_DELTA = "delta"


class YDStarter(Element):
    """Y-Δ (Star-Delta) motor starter block.

    Internally manages three contactors (K1 main, K2 star, K3 delta) and
    an ON-delay timer for the star→delta changeover.

    Params:
        changeover_delay: seconds before switching from Y to Δ (default 5)
        label: display label

    Exposed state:
        mode: "off" | "star" | "delta"
        energized: True when main contactor K1 is on
    """

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        super().__init__(id, terminal_a, terminal_b, params)
        self.changeover_delay: float = float(params.get("changeover_delay", 5.0))
        self.energized: bool = False
        self.mode: str = YD_OFF
        self._elapsed: float = 0.0

    def conducts(self) -> bool:
        return False

    def update(self, dt: float, ctx: "SolveContext") -> None:
        if not self.energized:
            self.mode = YD_OFF
            self._elapsed = 0.0
            return
        if self.mode == YD_OFF:
            self.mode = YD_STAR
            self._elapsed = 0.0
        elif self.mode == YD_STAR:
            self._elapsed += dt
            if self._elapsed >= self.changeover_delay:
                self.mode = YD_DELTA
        # delta stays delta until de-energized

    def get_state(self) -> dict[str, Any]:
        return {
            "energized": self.energized,
            "mode": self.mode,
            "elapsed": round(self._elapsed, 3),
            "remaining": round(max(0.0, self.changeover_delay - self._elapsed), 3),
        }
