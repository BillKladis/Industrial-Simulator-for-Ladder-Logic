from __future__ import annotations
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.engine.runtime import SimulationRuntime
from app.api.schemas import CircuitSchema

router = APIRouter()

# In-memory store of active runtimes keyed by session/circuit id
_sessions: dict[str, SimulationRuntime] = {}


@router.websocket("/ws/sim/{session_id}")
async def simulation_socket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    circuit_data: dict = {"elements": [], "wires": []}
    runtime: SimulationRuntime | None = None
    running = False

    async def push_tick(tick_data: dict) -> None:
        try:
            await websocket.send_text(json.dumps(tick_data))
        except Exception:
            pass

    async def send_error(msg: str) -> None:
        await websocket.send_text(json.dumps({"type": "error", "message": msg}))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await send_error("Invalid JSON")
                continue

            msg_type = msg.get("type", "")

            if msg_type == "load_circuit":
                # Client sends full circuit JSON
                try:
                    validated = CircuitSchema.model_validate(msg.get("data", {}))
                    circuit_data = validated.model_dump(by_alias=True)
                    if runtime:
                        runtime.reload(circuit_data)
                    await websocket.send_text(json.dumps({"type": "loaded"}))
                except Exception as e:
                    await send_error(str(e))

            elif msg_type == "start_sim":
                if running and runtime:
                    pass  # already running
                else:
                    if runtime:
                        await runtime.stop()
                    runtime = SimulationRuntime(circuit_data, push_tick)
                    runtime.start()
                    running = True
                    await websocket.send_text(json.dumps({"type": "sim_started"}))

            elif msg_type == "stop_sim":
                if runtime:
                    await runtime.stop()
                    runtime = None
                running = False
                await websocket.send_text(json.dumps({"type": "sim_stopped"}))

            elif msg_type == "button_event":
                if runtime:
                    runtime.handle_event(msg)

            elif msg_type == "trip_overload":
                if runtime:
                    runtime.handle_event(msg)

            elif msg_type == "blow_fuse":
                if runtime:
                    runtime.handle_event(msg)

            elif msg_type == "reset_fuse":
                if runtime:
                    runtime.handle_event(msg)

            elif msg_type == "place_element":
                el = msg.get("element", {})
                circuit_data.setdefault("elements", [])
                # Remove existing element with same id if present
                circuit_data["elements"] = [
                    e for e in circuit_data["elements"] if e.get("id") != el.get("id")
                ]
                circuit_data["elements"].append(el)
                if runtime:
                    runtime.reload(circuit_data)

            elif msg_type == "delete_element":
                eid = msg.get("elementId", "")
                circuit_data["elements"] = [
                    e for e in circuit_data.get("elements", []) if e.get("id") != eid
                ]
                circuit_data["wires"] = [
                    w
                    for w in circuit_data.get("wires", [])
                    if w.get("from", {}).get("elementId") != eid
                    and w.get("to", {}).get("elementId") != eid
                ]
                if runtime:
                    runtime.reload(circuit_data)

            elif msg_type == "move_element":
                eid = msg.get("elementId")
                for el in circuit_data.get("elements", []):
                    if el.get("id") == eid:
                        el["x"] = msg.get("x", el["x"])
                        el["y"] = msg.get("y", el["y"])

            elif msg_type == "connect_wire":
                wire = msg.get("wire", {})
                circuit_data.setdefault("wires", [])
                circuit_data["wires"] = [
                    w for w in circuit_data["wires"] if w.get("id") != wire.get("id")
                ]
                circuit_data["wires"].append(wire)
                if runtime:
                    runtime.reload(circuit_data)

            elif msg_type == "delete_wire":
                wid = msg.get("wireId", "")
                circuit_data["wires"] = [
                    w for w in circuit_data.get("wires", []) if w.get("id") != wid
                ]
                if runtime:
                    runtime.reload(circuit_data)

            elif msg_type == "update_params":
                eid = msg.get("elementId")
                new_params = msg.get("params", {})
                for el in circuit_data.get("elements", []):
                    if el.get("id") == eid:
                        el.setdefault("params", {}).update(new_params)
                if runtime:
                    runtime.reload(circuit_data)

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    finally:
        if runtime:
            await runtime.stop()
