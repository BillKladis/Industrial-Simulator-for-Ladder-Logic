from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
import uuid


def new_id(prefix: str = "el") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


# ---------------------------------------------------------------------------
# Circuit data shapes (mirrored in frontend types/circuit.ts)
# ---------------------------------------------------------------------------

class PortRef(BaseModel):
    elementId: str
    port: str  # "a" | "b"


class ElementData(BaseModel):
    id: str = Field(default_factory=lambda: new_id("el"))
    type: str
    x: float = 0
    y: float = 0
    rotation: int = 0
    params: dict[str, Any] = Field(default_factory=dict)
    ports: dict[str, str] = Field(default_factory=dict)  # {"a": node_id, "b": node_id}


class WireData(BaseModel):
    id: str = Field(default_factory=lambda: new_id("w"))
    from_: PortRef = Field(alias="from")
    to: PortRef
    node: str  # shared node id
    polyline: list[list[float]] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class CircuitSchema(BaseModel):
    schema_version: int = 1
    elements: list[ElementData] = Field(default_factory=list)
    wires: list[WireData] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# REST
# ---------------------------------------------------------------------------

class CircuitCreate(BaseModel):
    name: str
    data: CircuitSchema = Field(default_factory=CircuitSchema)


class CircuitSummary(BaseModel):
    id: int
    name: str
    updated_at: str


class CircuitFull(CircuitSummary):
    data: CircuitSchema


# ---------------------------------------------------------------------------
# WebSocket messages (client → server)
# ---------------------------------------------------------------------------

class WsMessageBase(BaseModel):
    type: str


class PlaceElement(WsMessageBase):
    type: str = "place_element"
    element: ElementData


class MoveElement(WsMessageBase):
    type: str = "move_element"
    elementId: str
    x: float
    y: float


class ConnectWire(WsMessageBase):
    type: str = "connect_wire"
    wire: WireData


class DeleteWire(WsMessageBase):
    type: str = "delete_wire"
    wireId: str


class DeleteElement(WsMessageBase):
    type: str = "delete_element"
    elementId: str


class UpdateParams(WsMessageBase):
    type: str = "update_params"
    elementId: str
    params: dict[str, Any]


class ButtonEvent(WsMessageBase):
    type: str = "button_event"
    elementId: str
    pressed: bool
    toggle: bool = False


class StartSim(WsMessageBase):
    type: str = "start_sim"


class StopSim(WsMessageBase):
    type: str = "stop_sim"


class SaveCircuit(WsMessageBase):
    type: str = "save"
    name: str = ""


class LoadCircuit(WsMessageBase):
    type: str = "load"
    circuitId: int


class TripOverload(WsMessageBase):
    type: str = "trip_overload"
    elementId: str


# ---------------------------------------------------------------------------
# WebSocket messages (server → client)
# ---------------------------------------------------------------------------

class TickMessage(BaseModel):
    type: str = "tick"
    t: float
    liveNodes: list[str]
    elements: dict[str, Any]


class ErrorMessage(BaseModel):
    type: str = "error"
    message: str


class SavedMessage(BaseModel):
    type: str = "saved"
    circuitId: int
