import { create } from 'zustand'
import type { ElementTickState } from '../types/circuit'

interface SimStore {
  running: boolean
  connected: boolean
  tickTime: number
  liveNodes: Set<string>
  elementStates: Map<string, ElementTickState>
  tickRate: number  // measured ticks/s
  _tickCount: number
  _lastTickAt: number

  setRunning: (v: boolean) => void
  setConnected: (v: boolean) => void
  applyTick: (t: number, liveNodes: string[], elements: Record<string, ElementTickState>) => void
  reset: () => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  running: false,
  connected: false,
  tickTime: 0,
  liveNodes: new Set(),
  elementStates: new Map(),
  tickRate: 0,
  _tickCount: 0,
  _lastTickAt: 0,

  setRunning: (v) => set({ running: v }),
  setConnected: (v) => set({ connected: v }),

  applyTick(t, liveNodes, elements) {
    const now = Date.now()
    const s = get()
    const count = s._tickCount + 1
    const dt = (now - s._lastTickAt) / 1000
    const tickRate = dt > 0 ? 1 / dt : s.tickRate
    set({
      tickTime: t,
      liveNodes: new Set(liveNodes),
      elementStates: new Map(Object.entries(elements)),
      _tickCount: count,
      _lastTickAt: now,
      tickRate: Math.round(tickRate),
    })
  },

  reset() {
    set({
      running: false,
      liveNodes: new Set(),
      elementStates: new Map(),
      tickTime: 0,
      _tickCount: 0,
    })
  },
}))
