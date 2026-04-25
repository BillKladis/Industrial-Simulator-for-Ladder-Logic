import { create } from 'zustand'
import type { CircuitElement, Wire, CircuitData, ElementType } from '../types/circuit'
import { SYMBOL_W, SYMBOL_H } from '../types/circuit'

let _counter = 0
const uid = (prefix: string) => `${prefix}_${(++_counter).toString(16).padStart(6, '0')}`

interface CircuitStore {
  elements: Record<string, CircuitElement>
  wires: Record<string, Wire>
  circuitName: string

  // mutations
  placeElement: (type: ElementType, x: number, y: number) => CircuitElement
  moveElement: (id: string, x: number, y: number) => void
  rotateElement: (id: string, delta: 90 | -90) => void
  deleteElement: (id: string) => void
  updateParams: (id: string, params: Record<string, unknown>) => void
  addWire: (wire: Wire) => void
  deleteWire: (id: string) => void
  loadCircuit: (data: CircuitData, name?: string) => void
  clearCircuit: () => void
  getCircuitData: () => CircuitData
  setName: (name: string) => void
}

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  elements: {},
  wires: {},
  circuitName: 'Untitled',

  placeElement(type, x, y) {
    const id = uid('el')
    // Rails always bind to the fixed power-bus nodes so the backend can
    // recognise them without needing to trace wires.
    const nodeA = type === 'rail_r' ? '__R__' : type === 'rail_n' ? '__N__' : uid('n')
    const nodeB = type === 'rail_r' ? '__R__' : type === 'rail_n' ? '__N__' : uid('n')
    const el: CircuitElement = {
      id,
      type,
      x,
      y,
      rotation: 0,
      params: defaultParams(type),
      ports: { a: nodeA, b: nodeB },
    }
    set((s) => ({ elements: { ...s.elements, [id]: el } }))
    return el
  },

  rotateElement(id, delta) {
    set((s) => {
      const el = s.elements[id]
      if (!el) return {}
      const next = (((el.rotation + delta) % 360) + 360) % 360 as 0 | 90 | 180 | 270
      return { elements: { ...s.elements, [id]: { ...el, rotation: next } } }
    })
  },

  moveElement(id, x, y) {
    set((s) => ({
      elements: {
        ...s.elements,
        [id]: { ...s.elements[id], x, y },
      },
    }))
  },

  deleteElement(id) {
    set((s) => {
      const { [id]: _, ...rest } = s.elements
      const wires = Object.fromEntries(
        Object.entries(s.wires).filter(
          ([, w]) => w.from.elementId !== id && w.to.elementId !== id
        )
      )
      return { elements: rest, wires }
    })
  },

  updateParams(id, params) {
    set((s) => ({
      elements: {
        ...s.elements,
        [id]: { ...s.elements[id], params: { ...s.elements[id].params, ...params } },
      },
    }))
  },

  addWire(wire) {
    set((s) => ({ wires: { ...s.wires, [wire.id]: wire } }))
  },

  deleteWire(id) {
    set((s) => {
      const { [id]: _, ...rest } = s.wires
      return { wires: rest }
    })
  },

  loadCircuit(data, name) {
    const elements: Record<string, CircuitElement> = {}
    const wires: Record<string, Wire> = {}
    for (const el of data.elements) elements[el.id] = el as CircuitElement
    for (const w of data.wires) wires[w.id] = w as Wire
    set({ elements, wires, circuitName: name ?? 'Untitled' })
  },

  clearCircuit() {
    set({ elements: {}, wires: {} })
  },

  getCircuitData(): CircuitData {
    const s = get()
    return {
      schema_version: 1,
      elements: Object.values(s.elements),
      wires: Object.values(s.wires),
    }
  },

  setName(name) {
    set({ circuitName: name })
  },
}))

function defaultParams(type: ElementType): Record<string, unknown> {
  switch (type) {
    case 'on_delay_timer':
      return { delay: 5, label: '' }
    case 'on_delay_contact_no':
    case 'on_delay_contact_nc':
      return { timer_id: '', label: '' }
    case 'off_delay_timer':
      return { delay: 5, label: '' }
    case 'off_delay_contact_no':
    case 'off_delay_contact_nc':
      return { timer_id: '', label: '' }
    // playground sensors
    case 'proximity_no':
    case 'proximity_nc':
      return { label: '' }
    case 'temp_sensor_no':
    case 'temp_sensor_nc':
      return { threshold: 50, label: '' }
    // playground actuators
    case 'linear_piston':
      return { extension: 80, direction: 'right', sticky: false, label: '' }
    case 'air_cylinder_sa':
      return { coil_id: '', extension: 80, direction: 'right', label: '' }
    case 'air_cylinder_da':
      return { coil_id: '', retract_coil_id: '', extension: 80, direction: 'right', label: '' }
    case 'air_valve':
      return { label: '' }
    case 'air_reservoir':
      return { label: '' }
    case 'npos_lever':
      return { positions: 3, label: '' }
    case 'npos_contact_no':
    case 'npos_contact_nc':
      return { lever_id: '', close_at: 0, label: '' }
    case 'pulse_relay':
      return { pulse_duration: 0.5, label: '' }
    case 'relay_contact_no':
    case 'relay_contact_nc':
      return { coil_id: '', label: '' }
    case 'thermal_contact_no':
    case 'thermal_contact_nc':
      return { overload_id: '', label: '' }
    case 'yd_starter':
      return { changeover_delay: 5, label: 'Y-Δ' }
    default:
      return { label: '' }
  }
}
