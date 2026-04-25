from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.engine.solver import SolveContext


class Element(ABC):
    """Abstract base for every circuit element."""

    def __init__(self, id: str, terminal_a: str, terminal_b: str, params: dict[str, Any]):
        self.id = id
        self.terminal_a = terminal_a
        self.terminal_b = terminal_b
        self.params = params

    @abstractmethod
    def conducts(self) -> bool:
        """Return True if this element lets current flow between its terminals."""

    def update(self, dt: float, ctx: "SolveContext") -> None:
        """Called once per tick after the fixpoint loop completes. Override for timers etc."""

    def get_state(self) -> dict[str, Any]:
        """Serialisable state snapshot sent to the frontend each tick."""
        return {}

    @property
    def label(self) -> str:
        return self.params.get("label", self.id)
