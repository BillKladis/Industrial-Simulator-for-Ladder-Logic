import { create } from 'zustand'

export const PG_W = 460
export const PG_H = 560
export const SQ_SIZE = 50

export interface Placement {
  x: number
  y: number
}

interface PlaygroundStore {
  square: { x: number; y: number }
  placements: Record<string, Placement>
  manualTemps: Record<string, number>   // temp_sensor element id → °C
  moveSquare: (x: number, y: number) => void
  setPlacement: (id: string, x: number, y: number) => void
  initPlacement: (id: string, x: number, y: number) => void
  setManualTemp: (id: string, temp: number) => void
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  square: { x: 200, y: 280 },
  placements: {},
  manualTemps: {},

  moveSquare: (x, y) =>
    set({ square: { x: Math.max(0, Math.min(PG_W - SQ_SIZE, x)), y: Math.max(0, Math.min(PG_H - SQ_SIZE, y)) } }),

  setPlacement: (id, x, y) =>
    set((s) => ({ placements: { ...s.placements, [id]: { x, y } } })),

  initPlacement: (id, x, y) =>
    set((s) => s.placements[id] ? {} : { placements: { ...s.placements, [id]: { x, y } } }),

  setManualTemp: (id, temp) =>
    set((s) => ({ manualTemps: { ...s.manualTemps, [id]: temp } })),
}))
