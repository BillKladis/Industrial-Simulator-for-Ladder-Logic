import React from 'react'
import type { ElementType } from '../types/circuit'
import { DRAG_TYPE_KEY } from '../hooks/useDragDrop'

interface PaletteItem {
  type: ElementType
  label: string
}

const CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'Power',
    items: [
      { type: 'rail_r', label: 'Live Rail (L1)' },
      { type: 'rail_n', label: 'Neutral Rail (N)' },
    ],
  },
  {
    name: 'Inputs',
    items: [
      { type: 'push_button_no', label: 'PB NO' },
      { type: 'push_button_nc', label: 'PB NC' },
      { type: 'hand_switch', label: 'Hand Switch' },
      { type: 'limit_switch_no', label: 'LS NO' },
      { type: 'limit_switch_nc', label: 'LS NC' },
    ],
  },
  {
    name: 'Contacts',
    items: [
      { type: 'relay_contact_no', label: 'Relay NO' },
      { type: 'relay_contact_nc', label: 'Relay NC' },
      { type: 'thermal_contact_no', label: 'Thermal NO' },
      { type: 'thermal_contact_nc', label: 'Thermal NC' },
      { type: 'on_delay_contact_no', label: 'On-Dly NO' },
      { type: 'on_delay_contact_nc', label: 'On-Dly NC' },
      { type: 'off_delay_contact_no', label: 'Off-Dly NO' },
      { type: 'off_delay_contact_nc', label: 'Off-Dly NC' },
    ],
  },
  {
    name: 'Coils & Timers',
    items: [
      { type: 'relay_coil', label: 'Relay Coil' },
      { type: 'thermal_overload', label: 'Thermal OL' },
      { type: 'solenoid_valve', label: 'Solenoid' },
      { type: 'on_delay_timer', label: 'ON Delay' },
      { type: 'off_delay_timer', label: 'OFF Delay' },
      { type: 'pulse_relay', label: 'Pulse Relay' },
    ],
  },
  {
    name: 'Outputs',
    items: [
      { type: 'lamp', label: 'Lamp' },
      { type: 'siren', label: 'Siren' },
      { type: 'motor_3ph', label: 'Motor 3φ' },
    ],
  },
  {
    name: 'Wiring',
    items: [
      { type: 'fuse', label: 'Fuse' },
      { type: 'terminal', label: 'Terminal' },
    ],
  },
  {
    name: 'Compound',
    items: [
      { type: 'yd_starter', label: 'Y-Δ Starter' },
    ],
  },
  {
    name: 'Sensors',
    items: [
      { type: 'proximity_no', label: 'Proximity NO' },
      { type: 'proximity_nc', label: 'Proximity NC' },
      { type: 'temp_sensor_no', label: 'Temp NO' },
      { type: 'temp_sensor_nc', label: 'Temp NC' },
    ],
  },
  {
    name: 'Actuators',
    items: [
      { type: 'linear_piston', label: 'Lin. Piston' },
    ],
  },
  {
    name: 'Pneumatic',
    items: [
      { type: 'air_cylinder_sa', label: 'Air Cyl. SA' },
      { type: 'air_cylinder_da', label: 'Air Cyl. DA' },
      { type: 'air_valve', label: 'Air Valve' },
      { type: 'air_reservoir', label: 'Air Reservoir' },
    ],
  },
]

export function SymbolPalette() {
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-800 border-r border-slate-700 w-44 shrink-0">
      <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
        Symbols
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          <button
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-750 hover:bg-slate-700 flex justify-between items-center"
            onClick={() => setCollapsed((c) => ({ ...c, [cat.name]: !c[cat.name] }))}
          >
            {cat.name}
            <span>{collapsed[cat.name] ? '▸' : '▾'}</span>
          </button>
          {!collapsed[cat.name] && (
            <div className="flex flex-col gap-0.5 px-2 pb-1">
              {cat.items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE_KEY, item.type)}
                  className="px-2 py-1.5 text-xs text-slate-200 bg-slate-700 rounded cursor-grab hover:bg-slate-600 active:cursor-grabbing select-none"
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
