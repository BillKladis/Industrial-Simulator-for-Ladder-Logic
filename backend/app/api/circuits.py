from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.persistence.db import get_session
from app.persistence import repository as repo
from app.api.schemas import (
    CircuitCreate,
    CircuitSummary,
    CircuitFull,
    CircuitSchema,
)

router = APIRouter(prefix="/circuits", tags=["circuits"])


@router.get("/", response_model=list[CircuitSummary])
async def list_circuits(session: AsyncSession = Depends(get_session)):
    circuits = await repo.list_circuits(session)
    return [
        CircuitSummary(
            id=c.id,
            name=c.name,
            updated_at=c.updated_at.isoformat(),
        )
        for c in circuits
    ]


@router.post("/", response_model=CircuitFull, status_code=201)
async def create_circuit(body: CircuitCreate, session: AsyncSession = Depends(get_session)):
    c = await repo.create_circuit(session, body.name, body.data)
    return _full(c)


@router.get("/{circuit_id}", response_model=CircuitFull)
async def get_circuit(circuit_id: int, session: AsyncSession = Depends(get_session)):
    c = await repo.get_circuit(session, circuit_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return _full(c)


@router.put("/{circuit_id}", response_model=CircuitFull)
async def update_circuit(
    circuit_id: int, body: CircuitCreate, session: AsyncSession = Depends(get_session)
):
    c = await repo.update_circuit(session, circuit_id, body.name, body.data)
    if c is None:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return _full(c)


@router.delete("/{circuit_id}", status_code=204)
async def delete_circuit(circuit_id: int, session: AsyncSession = Depends(get_session)):
    ok = await repo.delete_circuit(session, circuit_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Circuit not found")


def _full(c) -> CircuitFull:
    import json
    data = CircuitSchema.model_validate(json.loads(c.json_blob))
    return CircuitFull(
        id=c.id,
        name=c.name,
        updated_at=c.updated_at.isoformat(),
        data=data,
    )
