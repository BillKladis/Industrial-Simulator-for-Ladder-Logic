import { create } from 'zustand'

export const PG_W = 460
export const PG_H = 560
export const SQ_SIZE = 50

export type PgDeviceType =
  | 'linear_piston'
  | 'air_cylinder_sa'
  | 'air_cylinder_da'
  | 'air_valve'
  | 'air_reservoir'
  | 'motor_3ph'
  | 'valve_22'
  | 'valve_32'
  | 'valve_42'
  | 'valve_52'
  | 'valve_53'

export const DEVICE_LABELS: Record<PgDeviceType, string> = {
  linear_piston:   'Lin. Piston',
  air_cylinder_sa: 'Cylinder SA',
  air_cylinder_da: 'Cylinder DA',
  air_valve:       'Air Valve',
  air_reservoir:   'Air Reservoir',
  motor_3ph:       'Motor 3φ',
  valve_22:        '2/2 Valve',
  valve_32:        '3/2 Valve',
  valve_42:        '4/2 Valve',
  valve_52:        '5/2 Valve',
  valve_53:        '5/3 Valve',
}

export interface PlaygroundDevice {
  id: string
  deviceType: PgDeviceType
  coil_id: string
  retract_coil_id: string
  extension: number
  direction: 'right' | 'left' | 'up' | 'down'
  sticky: boolean
  label: string
}

export interface Placement { x: number; y: number }

let _c = 0
const devId = () => `pgdev_${(++_c).toString(16).padStart(4, '0')}`

interface PlaygroundStore {
  square: { x: number; y: number }
  placements: Record<string, Placement>
  manualTemps: Record<string, number>
  devices: PlaygroundDevice[]
  moveSquare: (x: number, y: number) => void
  setPlacement: (id: string, x: number, y: number) => void
  initPlacement: (id: string, x: number, y: number) => void
  setManualTemp: (id: string, temp: number) => void
  addDevice: (t: PgDeviceType) => string
  removeDevice: (id: string) => void
  updateDevice: (id: string, u: Partial<Omit<PlaygroundDevice, 'id' | 'deviceType'>>) => void
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  square: { x: 200, y: 260 },
  placements: {},
  manualTemps: {},
  devices: [],

  moveSquare: (x, y) => set({
    square: { x: Math.max(0, Math.min(PG_W - SQ_SIZE, x)), y: Math.max(0, Math.min(PG_H - SQ_SIZE, y)) },
  }),

  setPlacement:  (id, x, y) => set((s) => ({ placements: { ...s.placements, [id]: { x, y } } })),
  initPlacement: (id, x, y) => set((s) => s.placements[id] ? {} : { placements: { ...s.placements, [id]: { x, y } } }),
  setManualTemp: (id, t)    => set((s) => ({ manualTemps: { ...s.manualTemps, [id]: t } })),

  addDevice: (deviceType) => {
    const id = devId()
    set((s) => ({ devices: [...s.devices, { id, deviceType, coil_id: '', retract_coil_id: '', extension: 80, direction: 'right', sticky: false, label: '' }] }))
    return id
  },

  removeDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

  updateDevice: (id, u) => set((s) => ({ devices: s.devices.map((d) => d.id === id ? { ...d, ...u } : d) })),
}))
