// Shared circuit data shapes — mirrors backend app/api/schemas.py

export type ElementType =
  // inputs
  | 'push_button_no' | 'push_button_nc'
  | 'hand_switch'
  | 'limit_switch_no' | 'limit_switch_nc'
  // relay contacts
  | 'relay_contact_no' | 'relay_contact_nc'
  | 'thermal_contact_no' | 'thermal_contact_nc'
  | 'on_delay_contact_no' | 'on_delay_contact_nc'
  | 'off_delay_contact_no' | 'off_delay_contact_nc'
  // coils
  | 'relay_coil'
  | 'thermal_overload'
  | 'solenoid_valve'
  // timers
  | 'on_delay_timer' | 'off_delay_timer' | 'pulse_relay'
  // outputs
  | 'lamp' | 'siren' | 'motor_3ph' | 'instrument'
  // passive
  | 'fuse' | 'terminal' | 'wire'
  // rails
  | 'rail_r' | 'rail_n'
  // compound
  | 'yd_starter'

export interface CircuitElement {
  id: string
  type: ElementType
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  params: Record<string, unknown>
  ports: { a: string; b: string }
}

export interface PortRef {
  elementId: string
  port: 'a' | 'b'
}

export interface Wire {
  id: string
  from: PortRef
  to: PortRef
  node: string
  polyline: [number, number][]
}

export interface CircuitData {
  schema_version: number
  elements: CircuitElement[]
  wires: Wire[]
}

// WebSocket tick message (server → client)
export interface TickMessage {
  type: 'tick'
  t: number
  liveNodes: string[]
  elements: Record<string, ElementTickState>
}

export interface ElementTickState {
  energized?: boolean
  pressed?: boolean
  on?: boolean
  actuated?: boolean
  done?: boolean
  elapsed?: number
  remaining?: number
  output_active?: boolean
  pulsing?: boolean
  mode?: 'off' | 'star' | 'delta'
  tripped?: boolean
  blown?: boolean
  coil_energized?: boolean
}

// Port positions (canvas coords relative to element top-left)
export interface PortPosition {
  a: { x: number; y: number }
  b: { x: number; y: number }
}

export const GRID = 20  // px grid snap

// Each symbol is 60×40 (3×2 grid cells) unless noted
export const SYMBOL_W = 60
export const SYMBOL_H = 40
