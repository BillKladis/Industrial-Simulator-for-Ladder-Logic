from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.circuits import router as circuits_router
from app.ws.simulation_socket import router as ws_router
from app.persistence.db import init_db
from app.config import settings

app = FastAPI(title="Industrial Ladder-Logic Simulator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(circuits_router, prefix="/api")
app.include_router(ws_router)


@app.on_event("startup")
async def startup() -> None:
    await init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
