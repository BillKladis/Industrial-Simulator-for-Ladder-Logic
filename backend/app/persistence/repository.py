from __future__ import annotations
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.persistence.models import Circuit
from app.api.schemas import CircuitSchema


async def list_circuits(session: AsyncSession) -> list[Circuit]:
    result = await session.execute(select(Circuit).order_by(Circuit.updated_at.desc()))
    return list(result.scalars().all())


async def get_circuit(session: AsyncSession, circuit_id: int) -> Circuit | None:
    return await session.get(Circuit, circuit_id)


async def create_circuit(session: AsyncSession, name: str, data: CircuitSchema) -> Circuit:
    c = Circuit(name=name, json_blob=data.model_dump_json())
    session.add(c)
    await session.commit()
    await session.refresh(c)
    return c


async def update_circuit(
    session: AsyncSession, circuit_id: int, name: str, data: CircuitSchema
) -> Circuit | None:
    c = await session.get(Circuit, circuit_id)
    if c is None:
        return None
    c.name = name
    c.json_blob = data.model_dump_json()
    await session.commit()
    await session.refresh(c)
    return c


async def delete_circuit(session: AsyncSession, circuit_id: int) -> bool:
    c = await session.get(Circuit, circuit_id)
    if c is None:
        return False
    await session.delete(c)
    await session.commit()
    return True


def parse_circuit_data(c: Circuit) -> CircuitSchema:
    return CircuitSchema.model_validate(json.loads(c.json_blob))
