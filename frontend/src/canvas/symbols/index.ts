import type { ElementType, ElementTickState, CircuitElement } from '../../types/circuit'
import React from 'react'

import { PushButton } from './PushButton'
import { RelayContact } from './RelayContact'
import { RelayCoil } from './RelayCoil'
import { OnDelayTimer } from './OnDelayTimer'
import { OffDelayTimer } from './OffDelayTimer'
import { PulseRelay } from './PulseRelay'
import { ThermalRelay } from './ThermalRelay'
import { Lamp } from './Lamp'
import { Siren } from './Siren'
import { Motor3Ph } from './Motor3Ph'
import { Fuse } from './Fuse'
import { HandSwitch } from './HandSwitch'
import { LimitSwitch } from './LimitSwitch'
import { SolenoidValve } from './SolenoidValve'
import { YDStarter } from './YDStarter'
import { Terminal } from './Terminal'
import { RailSymbol } from './RailSymbol'
import { ProximitySensor } from './ProximitySensor'
import { TempSensor } from './TempSensor'
import { LinearPiston } from './LinearPiston'
import { AirCylinderSA, AirCylinderDA } from './AirCylinder'
import { AirValveSym } from './AirValveSym'
import { AirReservoir } from './AirReservoir'
import { NposLever } from './NposLever'
import { NposContact } from './NposContact'

export type SymbolProps = {
  element: CircuitElement
  state: ElementTickState
}

export const PORT_OFFSETS: Partial<Record<ElementType, { a: { x: number; y: number }; b: { x: number; y: number } }>> = {
  push_button_no:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  push_button_nc:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  hand_switch:         { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  limit_switch_no:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  limit_switch_nc:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  relay_contact_no:    { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  relay_contact_nc:    { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  thermal_contact_no:  { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  thermal_contact_nc:  { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  on_delay_contact_no: { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  on_delay_contact_nc: { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  off_delay_contact_no:{ a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  off_delay_contact_nc:{ a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  relay_coil:          { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  thermal_overload:    { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  solenoid_valve:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  on_delay_timer:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  off_delay_timer:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  pulse_relay:         { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  lamp:                { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  siren:               { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  motor_3ph:           { a: { x: 0, y: 30 }, b: { x: 60, y: 30 } },
  fuse:                { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  terminal:            { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  yd_starter:          { a: { x: 0, y: 30 }, b: { x: 80, y: 30 } },
  rail_r:              { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  rail_n:              { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  // new types
  proximity_no:        { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  proximity_nc:        { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  temp_sensor_no:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  temp_sensor_nc:      { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  linear_piston:       { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  air_cylinder_sa:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  air_cylinder_da:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  air_valve:           { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  air_reservoir:       { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  npos_lever:          { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  npos_contact_no:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
  npos_contact_nc:     { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } },
}

type SymbolComponent = (props: { element: CircuitElement; state: ElementTickState }) => React.ReactElement | null

function wrap(
  Comp: React.ComponentType<any>,
  extraProps: (el: CircuitElement, st: ElementTickState) => Record<string, unknown>
): SymbolComponent {
  return ({ element, state }) =>
    React.createElement(Comp, {
      energized: state.energized ?? false,
      label: String(element.params.label ?? ''),
      ...extraProps(element, state),
    })
}

export const SYMBOL_MAP: Partial<Record<ElementType, SymbolComponent>> = {
  push_button_no: wrap(PushButton, (el, st) => ({ normallyOpen: true, pressed: st.pressed ?? false })),
  push_button_nc: wrap(PushButton, (el, st) => ({ normallyOpen: false, pressed: st.pressed ?? false })),
  hand_switch: wrap(HandSwitch, (_, st) => ({ on: st.on ?? false })),
  limit_switch_no: wrap(LimitSwitch, (_, st) => ({ normallyOpen: true, actuated: st.actuated ?? false })),
  limit_switch_nc: wrap(LimitSwitch, (_, st) => ({ normallyOpen: false, actuated: st.actuated ?? false })),
  relay_contact_no: wrap(RelayContact, () => ({ normallyOpen: true })),
  relay_contact_nc: wrap(RelayContact, () => ({ normallyOpen: false })),
  thermal_contact_no: wrap(ThermalRelay, (_, st) => ({ normallyOpen: true, tripped: st.tripped ?? false })),
  thermal_contact_nc: wrap(ThermalRelay, (_, st) => ({ normallyOpen: false, tripped: st.tripped ?? false })),
  on_delay_contact_no: wrap(RelayContact, () => ({ normallyOpen: true })),
  on_delay_contact_nc: wrap(RelayContact, () => ({ normallyOpen: false })),
  off_delay_contact_no: wrap(RelayContact, () => ({ normallyOpen: true })),
  off_delay_contact_nc: wrap(RelayContact, () => ({ normallyOpen: false })),
  relay_coil: wrap(RelayCoil, () => ({})),
  thermal_overload: wrap(ThermalRelay, (_, st) => ({ tripped: st.tripped ?? false })),
  solenoid_valve: wrap(SolenoidValve, () => ({})),
  on_delay_timer: wrap(OnDelayTimer, (_, st) => ({ done: st.done ?? false, remaining: st.remaining })),
  off_delay_timer: wrap(OffDelayTimer, (_, st) => ({ output_active: st.output_active ?? false, remaining: st.remaining })),
  pulse_relay: wrap(PulseRelay, (_, st) => ({ pulsing: st.pulsing ?? false })),
  lamp: wrap(Lamp, () => ({})),
  siren: wrap(Siren, () => ({})),
  motor_3ph: wrap(Motor3Ph, () => ({})),
  fuse: wrap(Fuse, (_, st) => ({ blown: st.blown ?? false })),
  terminal: wrap(Terminal, () => ({})),
  yd_starter: wrap(YDStarter, (_, st) => ({ mode: st.mode ?? 'off', remaining: st.remaining })),
  rail_r: wrap(RailSymbol, () => ({ isR: true })),
  rail_n: wrap(RailSymbol, () => ({ isR: false })),
  // new sensors (contact-like: energized = conducts)
  proximity_no: wrap(ProximitySensor, (_, st) => ({ normallyOpen: true, energized: st.energized ?? false })),
  proximity_nc: wrap(ProximitySensor, (_, st) => ({ normallyOpen: false, energized: st.energized ?? false })),
  temp_sensor_no: wrap(TempSensor, (_, st) => ({ normallyOpen: true, energized: st.energized ?? false })),
  temp_sensor_nc: wrap(TempSensor, (_, st) => ({ normallyOpen: false, energized: st.energized ?? false })),
  // new actuators (coil-like)
  linear_piston: wrap(LinearPiston, () => ({})),
  air_cylinder_sa: wrap(AirCylinderSA, () => ({})),
  air_cylinder_da: wrap(AirCylinderDA, () => ({})),
  air_valve: wrap(AirValveSym, () => ({})),
  air_reservoir: wrap(AirReservoir, () => ({})),
  // npos lever (coil-like, shows dial with current position)
  npos_lever: wrap(NposLever, (el, st) => ({
    positions: Number(el.params.positions ?? 3),
    position: st.position ?? 0,
  })),
  // npos contacts (contact-like, close when lever is at configured position)
  npos_contact_no: wrap(NposContact, (el, st) => ({
    normallyOpen: true,
    closeAt: Number(el.params.close_at ?? 0),
    leverPosition: st.lever_position ?? -1,
  })),
  npos_contact_nc: wrap(NposContact, (el, st) => ({
    normallyOpen: false,
    closeAt: Number(el.params.close_at ?? 0),
    leverPosition: st.lever_position ?? -1,
  })),
}
