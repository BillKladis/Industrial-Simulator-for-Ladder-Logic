import type { CircuitData } from '../types/circuit'

const BASE = '/api'

export interface CircuitSummary {
  id: number
  name: string
  updated_at: string
}

export interface CircuitFull extends CircuitSummary {
  data: CircuitData
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const http = {
  listCircuits: () => request<CircuitSummary[]>('/circuits/'),
  getCircuit: (id: number) => request<CircuitFull>(`/circuits/${id}`),
  createCircuit: (name: string, data: CircuitData) =>
    request<CircuitFull>('/circuits/', {
      method: 'POST',
      body: JSON.stringify({ name, data }),
    }),
  updateCircuit: (id: number, name: string, data: CircuitData) =>
    request<CircuitFull>(`/circuits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, data }),
    }),
  deleteCircuit: (id: number) =>
    request<void>(`/circuits/${id}`, { method: 'DELETE' }),
}
