# Industrial Ladder-Logic Simulator

A browser-based simulator for industrial relay-logic (ladder) circuits.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Vite + Tailwind + Zustand |
| Canvas | Raw SVG + pointer events |
| Backend | FastAPI (Python) + asyncio WebSocket |
| Persistence | SQLite via SQLAlchemy |
| Transport | WebSocket (30 Hz tick loop) |

## Quick Start

### Backend

```bash
cd backend
pip install -e .            # or: uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Usage

1. **Drag** a symbol from the left palette onto the canvas.
2. **Click** a port (small circle on each element) to start drawing a wire, then click the destination port.
3. **Select** an element to edit its parameters (label, coil ID, delay) in the right Inspector panel.
4. Press **▶ Run** — the backend starts the 30 Hz tick loop and highlights live wires in green.
5. **Click push buttons** while running to interact with the circuit.
6. Press **■ Stop** to pause the simulation.

## Simulation Engine

The engine runs a BFS fixpoint solver each tick:

1. Build the *closed-contact* subgraph (only conducting elements).
2. BFS from the live rail **R** → find all live nodes.
3. BFS from neutral rail **N** → find all neutral-reachable nodes.
4. Energize any coil/output whose terminals span live ↔ neutral.
5. Push energized states into dependent contacts; re-solve until stable (≤ 16 iterations).
6. Advance timers with wall-clock `dt`; emit `{liveNodes, elementStates}` snapshot to frontend.

## Running Tests

```bash
cd backend
pytest
```

## Project Structure

```
backend/
  app/
    engine/          # BFS solver, element registry, async tick loop
    api/             # REST /circuits endpoints
    ws/              # WebSocket /ws/sim/{id}
    persistence/     # SQLAlchemy models + repository
  tests/

frontend/
  src/
    canvas/          # SVG canvas, symbols, wire drawing
    components/      # Toolbar, palette, inspector, status bar
    store/           # Zustand: circuit state + sim state
    hooks/           # WebSocket lifecycle, drag-drop, wire drawing
    types/           # Shared TypeScript types
```
