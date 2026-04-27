import React, { useCallback, useEffect, useRef } from 'react'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import {
  usePlaygroundStore,
  PG_W, PG_H, SQ_SIZE,
  DEVICE_LABELS,
  type PgDeviceType, type PlaygroundDevice,
} from '../store/playgroundStore'
import type { CircuitElement } from '../types/circuit'

// Sensor element types — still live in the circuit as contacts
const SENSOR_TYPES = new Set(['proximity_no', 'proximity_nc', 'temp_sensor_no', 'temp_sensor_nc'])
const PROX_RANGE = 70

interface Props {
  send: (msg: Record<string, unknown>) => void
}

export function Playground({ send }: Props) {
  const elements = useCircuitStore((s) => s.elements)
  const elementStates = useSimStore((s) => s.elementStates)
  const {
    square, placements, manualTemps, devices,
    moveSquare, setPlacement, initPlacement, setManualTemp,
    addDevice, removeDevice, updateDevice,
  } = usePlaygroundStore()

  // Sensor elements from the circuit
  const sensorElements = (Object.values(elements) as CircuitElement[]).filter(
    (el) => SENSOR_TYPES.has(el.type)
  )

  // Auto-init sensor placements
  const sensorIds = sensorElements.map((e) => e.id).join(',')
  useEffect(() => {
    sensorElements.forEach((el, i) => {
      initPlacement(el.id, 20 + (i % 4) * 110, 380 + Math.floor(i / 4) * 90)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorIds])

  // Auto-init device placements
  useEffect(() => {
    devices.forEach((dev, i) => {
      initPlacement(dev.id, 20 + (i % 4) * 110, 200 + Math.floor(i / 4) * 90)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.map((d) => d.id).join(',')])

  // Last-sent sensor state (avoids flooding backend)
  const lastSent = useRef<Record<string, boolean>>({})

  // Proximity detection → button_event
  useEffect(() => {
    const sqCx = square.x + SQ_SIZE / 2
    const sqCy = square.y + SQ_SIZE / 2
    sensorElements.forEach((el) => {
      if (el.type !== 'proximity_no' && el.type !== 'proximity_nc') return
      const pos = placements[el.id]
      if (!pos) return
      const dist = Math.sqrt((sqCx - (pos.x + 30)) ** 2 + (sqCy - (pos.y + 20)) ** 2)
      const detected = dist < PROX_RANGE
      if (lastSent.current[el.id] !== detected) {
        lastSent.current[el.id] = detected
        send({ type: 'button_event', elementId: el.id, pressed: detected })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [square.x, square.y, placements])

  // Temperature threshold detection → button_event
  useEffect(() => {
    sensorElements.forEach((el) => {
      if (el.type !== 'temp_sensor_no' && el.type !== 'temp_sensor_nc') return
      const threshold = Number(el.params.threshold ?? 50)
      const temp = manualTemps[el.id] ?? 20
      const active = temp >= threshold
      if (lastSent.current[el.id] !== active) {
        lastSent.current[el.id] = active
        send({ type: 'button_event', elementId: el.id, pressed: active })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualTemps])

  // Piston push/pull — driven by the device's referenced coil
  const prevPiston = useRef<Record<string, boolean>>({})
  useEffect(() => {
    devices.forEach((dev) => {
      if (dev.deviceType !== 'linear_piston') return
      const coilState = elementStates.get(dev.coil_id)
      const energized = coilState?.energized ?? false
      const prev = prevPiston.current[dev.id] ?? false
      if (energized === prev) return
      prevPiston.current[dev.id] = energized
      const dx = dev.direction === 'right' ? dev.extension : dev.direction === 'left' ? -dev.extension : 0
      const dy = dev.direction === 'down' ? dev.extension : dev.direction === 'up' ? -dev.extension : 0
      if (energized) {
        moveSquare(square.x + dx, square.y + dy)
      } else if (!dev.sticky) {
        moveSquare(square.x - dx, square.y - dy)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementStates])

  // Dragging
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingSquare, setDraggingSquare] = React.useState(false)
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const sqOff = useRef({ x: 0, y: 0 })
  const itemOff = useRef({ x: 0, y: 0 })

  const onSquareDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    sqOff.current = { x: e.clientX - r.left - square.x, y: e.clientY - r.top - square.y }
    setDraggingSquare(true)
  }, [square])

  const onItemDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const pos = placements[id] ?? { x: 0, y: 0 }
    itemOff.current = { x: e.clientX - r.left - pos.x, y: e.clientY - r.top - pos.y }
    setDraggingId(id)
  }, [placements])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    if (draggingSquare) moveSquare(cx - sqOff.current.x, cy - sqOff.current.y)
    if (draggingId) setPlacement(draggingId, cx - itemOff.current.x, cy - itemOff.current.y)
  }, [draggingSquare, draggingId, moveSquare, setPlacement])

  const onMouseUp = useCallback(() => {
    setDraggingSquare(false)
    setDraggingId(null)
  }, [])

  // Device config selection
  const [selectedDevId, setSelectedDevId] = React.useState<string | null>(null)
  const selectedDev = devices.find((d) => d.id === selectedDevId) ?? null

  // Add device dropdown
  const [showAdd, setShowAdd] = React.useState(false)
  const handleAddDevice = (type: PgDeviceType) => {
    addDevice(type)
    setShowAdd(false)
  }

  // Coil candidates for dropdowns
  const coilCandidates = (Object.values(elements) as CircuitElement[]).filter(
    (el) => el.type === 'relay_coil'
  )

  return (
    <div className="flex flex-col shrink-0 bg-slate-900 border-l border-slate-700" style={{ width: PG_W }}>
      {/* Header */}
      <div className="flex items-center px-3 py-1.5 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-1">Playground</span>
        <div className="relative">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
          >
            + Device
          </button>
          {showAdd && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded shadow-lg z-10">
              {(Object.keys(DEVICE_LABELS) as PgDeviceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleAddDevice(t)}
                  className="block w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                >
                  {DEVICE_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-slate-950"
        style={{ flex: 1, cursor: draggingSquare || draggingId ? 'grabbing' : 'default' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => setSelectedDevId(null)}
      >
        {/* Grid */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {Array.from({ length: Math.ceil(PG_W / 20) + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2="100%" stroke="#1e293b" strokeWidth={0.5} />
          ))}
          {Array.from({ length: Math.ceil(PG_H / 20) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 20} x2="100%" y2={i * 20} stroke="#1e293b" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Actuator devices */}
        {devices.map((dev) => {
          const pos = placements[dev.id] ?? { x: 20, y: 200 }
          const coilState = elementStates.get(dev.coil_id)
          const energized = coilState?.energized ?? false
          const retractState = elementStates.get(dev.retract_coil_id)
          const retracting = retractState?.energized ?? false
          return (
            <DeviceWidget
              key={dev.id}
              dev={dev}
              pos={pos}
              energized={energized}
              retracting={retracting}
              selected={selectedDevId === dev.id}
              onMouseDown={(e) => { e.stopPropagation(); onItemDown(e, dev.id); setSelectedDevId(dev.id) }}
              onRemove={() => { removeDevice(dev.id); setSelectedDevId(null) }}
            />
          )
        })}

        {/* Sensor widgets (circuit elements with playground presence) */}
        {sensorElements.map((el) => {
          const pos = placements[el.id] ?? { x: 20, y: 380 }
          const state = elementStates.get(el.id)
          const energized = state?.energized ?? false
          const sqCx = square.x + SQ_SIZE / 2
          const sqCy = square.y + SQ_SIZE / 2
          const dist = Math.sqrt((sqCx - (pos.x + 30)) ** 2 + (sqCy - (pos.y + 20)) ** 2)
          return (
            <SensorWidget
              key={el.id}
              el={el}
              pos={pos}
              energized={energized}
              inZone={dist < PROX_RANGE}
              manualTemp={manualTemps[el.id] ?? 20}
              onMouseDown={(e) => onItemDown(e, el.id)}
              onTempChange={(t) => setManualTemp(el.id, t)}
            />
          )
        })}

        {/* Movable square */}
        <div
          className="absolute rounded border-2 border-blue-400 bg-blue-900/40 flex items-center justify-center select-none"
          style={{ left: square.x, top: square.y, width: SQ_SIZE, height: SQ_SIZE, cursor: 'grab' }}
          onMouseDown={onSquareDown}
        >
          <span className="text-blue-300 text-xs font-bold pointer-events-none">BOX</span>
        </div>
      </div>

      {/* Device config panel */}
      {selectedDev && (
        <DeviceConfig
          dev={selectedDev}
          coilCandidates={coilCandidates}
          onChange={(updates) => updateDevice(selectedDev.id, updates)}
          onRemove={() => { removeDevice(selectedDev.id); setSelectedDevId(null) }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Device widget
// ---------------------------------------------------------------------------

interface DeviceWidgetProps {
  dev: PlaygroundDevice
  pos: { x: number; y: number }
  energized: boolean
  retracting: boolean
  selected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onRemove: () => void
}

function DeviceWidget({ dev, pos, energized, retracting, selected, onMouseDown, onRemove }: DeviceWidgetProps) {
  const green = '#22c55e'
  const muted = '#94a3b8'
  const stroke = energized ? green : muted
  const label = dev.label || DEVICE_LABELS[dev.deviceType]

  const base: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    userSelect: 'none', cursor: 'grab',
    outline: selected ? '2px solid #60a5fa' : 'none',
    borderRadius: 4,
  }

  if (dev.deviceType === 'linear_piston') {
    const rodExt = energized ? Math.min(dev.extension * 0.4, 52) : 8
    return (
      <div style={base} onMouseDown={onMouseDown}>
        <svg width={110} height={50}>
          <rect x={4} y={15} width={38} height={20} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={4} y={13} width={7} height={24} fill={stroke} rx={1} />
          <rect x={42} y={19} width={rodExt} height={12} fill={energized ? green : '#334155'} rx={1} />
          {energized && (
            <polygon points={`${42 + rodExt},15 ${42 + rodExt + 8},25 ${42 + rodExt},35`} fill={green} />
          )}
          <text x={23} y={10} textAnchor="middle" fontSize={8} fill={muted}>{dev.direction} {dev.extension}px</text>
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -6 }}>{label}</div>
        {selected && <RemoveBtn onRemove={onRemove} />}
      </div>
    )
  }

  if (dev.deviceType === 'air_cylinder_sa') {
    const rodExt = energized ? 30 : 8
    return (
      <div style={base} onMouseDown={onMouseDown}>
        <svg width={90} height={50}>
          <rect x={4} y={13} width={44} height={24} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={4} y={11} width={7} height={28} fill={stroke} rx={1} />
          <line x1={22} y1={13} x2={22} y2={6} stroke={energized ? green : '#475569'} strokeWidth={1.5} />
          <circle cx={22} cy={4} r={3} fill={energized ? green : '#475569'} />
          <rect x={48} y={18} width={rodExt} height={14} fill={energized ? green : '#334155'} rx={1} />
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -4 }}>{label}</div>
        {selected && <RemoveBtn onRemove={onRemove} />}
      </div>
    )
  }

  if (dev.deviceType === 'air_cylinder_da') {
    return (
      <div style={base} onMouseDown={onMouseDown}>
        <svg width={90} height={50}>
          <rect x={4} y={13} width={60} height={24} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={30} y={13} width={7} height={24} fill={stroke} opacity={0.7} />
          <line x1={18} y1={13} x2={18} y2={6} stroke={energized ? green : '#475569'} strokeWidth={1.5} />
          <circle cx={18} cy={4} r={3} fill={energized ? green : '#475569'} />
          <line x1={52} y1={13} x2={52} y2={6} stroke={retracting ? '#f59e0b' : '#475569'} strokeWidth={1.5} />
          <circle cx={52} cy={4} r={3} fill={retracting ? '#f59e0b' : '#475569'} />
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -4 }}>{label}</div>
        {selected && <RemoveBtn onRemove={onRemove} />}
      </div>
    )
  }

  if (dev.deviceType === 'air_valve') {
    const fillCol = energized ? '#14532d' : 'none'
    return (
      <div style={base} onMouseDown={onMouseDown}>
        <svg width={70} height={50}>
          <polygon points="10,12 10,36 28,24" stroke={stroke} strokeWidth={2} fill={fillCol} />
          <polygon points="60,12 60,36 42,24" stroke={stroke} strokeWidth={2} fill={fillCol} />
          <rect x={28} y={6} width={14} height={9} stroke={stroke} strokeWidth={1.5} fill={fillCol} rx={1} />
          <line x1={35} y1={15} x2={35} y2={18} stroke={stroke} strokeWidth={1.5} />
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -4 }}>{label}</div>
        {selected && <RemoveBtn onRemove={onRemove} />}
      </div>
    )
  }

  if (dev.deviceType === 'air_reservoir') {
    return (
      <div style={base} onMouseDown={onMouseDown}>
        <svg width={80} height={44}>
          <rect x={4} y={8} width={72} height={28} rx={10} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <text x={40} y={26} textAnchor="middle" fontSize={14} fill={stroke} fontWeight="bold">P</text>
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -4 }}>{label}</div>
        {selected && <RemoveBtn onRemove={onRemove} />}
      </div>
    )
  }

  if (dev.deviceType === 'motor_3ph') {
    return <Motor3PhWidget dev={dev} pos={pos} energized={energized} retracting={retracting} selected={selected} onMouseDown={onMouseDown} onRemove={onRemove} />
  }

  if (dev.deviceType === 'valve_22' || dev.deviceType === 'valve_32' || dev.deviceType === 'valve_42' || dev.deviceType === 'valve_52' || dev.deviceType === 'valve_53') {
    return <ValveWidget dev={dev} pos={pos} energized={energized} retracting={retracting} selected={selected} onMouseDown={onMouseDown} onRemove={onRemove} />
  }

  return null
}

// ---------------------------------------------------------------------------
// Motor 3-phase widget
// ---------------------------------------------------------------------------

interface PgWidgetProps {
  dev: PlaygroundDevice
  pos: { x: number; y: number }
  energized: boolean
  retracting: boolean
  selected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onRemove: () => void
}

function Motor3PhWidget({ dev, pos, energized, retracting, selected, onMouseDown, onRemove }: PgWidgetProps) {
  const label = dev.label || DEVICE_LABELS[dev.deviceType]
  const muted = '#94a3b8'
  const R = '#ef4444', S = '#eab308', T = '#3b82f6'
  // forward = RST→UVW straight; reverse = S↔T swapped (retracting coil)
  const fwd = energized && !retracting
  const rev = retracting
  const running = fwd || rev

  const base: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    userSelect: 'none', cursor: 'grab',
    outline: selected ? '2px solid #60a5fa' : 'none', borderRadius: 4,
  }

  return (
    <div style={base} onMouseDown={onMouseDown}>
      <svg width={120} height={90}>
        {/* Phase lines in */}
        <line x1={10} y1={10} x2={10} y2={42} stroke={R} strokeWidth={2.5} />
        <line x1={26} y1={10} x2={26} y2={42} stroke={S} strokeWidth={2.5} />
        <line x1={42} y1={10} x2={42} y2={42} stroke={T} strokeWidth={2.5} />
        {/* Phase labels */}
        <text x={10} y={8} textAnchor="middle" fontSize={7} fill={R} fontWeight="bold">R</text>
        <text x={26} y={8} textAnchor="middle" fontSize={7} fill={S} fontWeight="bold">S</text>
        <text x={42} y={8} textAnchor="middle" fontSize={7} fill={T} fontWeight="bold">T</text>
        {/* Swap indicator when reversed */}
        {rev && (
          <>
            <line x1={26} y1={22} x2={42} y2={34} stroke="#f59e0b" strokeWidth={1.5} />
            <line x1={42} y1={22} x2={26} y2={34} stroke="#f59e0b" strokeWidth={1.5} />
          </>
        )}
        {/* Motor circle */}
        <circle cx={52} cy={56} r={28} stroke={running ? (rev ? '#f59e0b' : '#22c55e') : muted} strokeWidth={2} fill="#1e293b" />
        <text x={52} y={54} textAnchor="middle" fontSize={9} fill={running ? '#fff' : muted} fontWeight="bold">M</text>
        <text x={52} y={65} textAnchor="middle" fontSize={8} fill={running ? '#fff' : '#475569'}>3~</text>
        {/* Rotation arc */}
        {running && (
          <path
            d={fwd
              ? 'M38,56 A14,14 0 0,1 66,56'
              : 'M66,56 A14,14 0 0,1 38,56'}
            fill="none"
            stroke={rev ? '#f59e0b' : '#22c55e'}
            strokeWidth={2}
            markerEnd="url(#arrowM)"
          />
        )}
        <defs>
          <marker id="arrowM" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={rev ? '#f59e0b' : '#22c55e'} />
          </marker>
        </defs>
        {/* Direction label */}
        {running && (
          <text x={52} y={88} textAnchor="middle" fontSize={7} fill={rev ? '#f59e0b' : '#22c55e'}>
            {rev ? 'REV' : 'FWD'}
          </text>
        )}
      </svg>
      <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: -2 }}>{label}</div>
      {selected && <RemoveBtn onRemove={onRemove} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Valve widget — ISO 1219 box-with-symbols notation
// ---------------------------------------------------------------------------

// Each valve type defines: number of positions (boxes), and per-position flow paths
// Flow path = array of [portFrom, portTo] or 'block:portName'
type ValveConfig = {
  positions: number
  ports: string[]       // port labels for stubs
  flows: Array<Array<[string, string] | ['block', string]>>
}

const VALVE_CONFIGS: Record<string, ValveConfig> = {
  valve_22: {
    positions: 2,
    ports: ['P', 'A'],
    flows: [
      [['block', 'P'], ['block', 'A']],
      [['P', 'A']],
    ],
  },
  valve_32: {
    positions: 2,
    ports: ['P', 'A', 'T'],
    flows: [
      [['A', 'T'], ['block', 'P']],
      [['P', 'A']],
    ],
  },
  valve_42: {
    positions: 2,
    ports: ['P', 'A', 'B', 'T'],
    flows: [
      [['P', 'A'], ['B', 'T']],
      [['P', 'B'], ['A', 'T']],
    ],
  },
  valve_52: {
    positions: 2,
    ports: ['P', 'A', 'B', 'T1', 'T2'],
    flows: [
      [['P', 'A'], ['B', 'T1']],
      [['P', 'B'], ['A', 'T2']],
    ],
  },
  valve_53: {
    positions: 3,
    ports: ['P', 'A', 'B', 'T1', 'T2'],
    flows: [
      [['P', 'A'], ['B', 'T1']],
      [['block', 'P'], ['block', 'A'], ['block', 'B']],
      [['P', 'B'], ['A', 'T2']],
    ],
  },
}

// Port positions within a box (relative to box top-left), by port name and valve type
// We lay them out: top ports and bottom ports
function getPortY(port: string, boxH: number): number {
  const topPorts = new Set(['A', 'B', 'T1', 'T2'])
  return topPorts.has(port) ? 2 : boxH - 2
}

function ValveWidget({ dev, pos, energized, retracting, selected, onMouseDown, onRemove }: PgWidgetProps) {
  const label = dev.label || DEVICE_LABELS[dev.deviceType]
  const cfg = VALVE_CONFIGS[dev.deviceType]
  if (!cfg) return null

  const BW = 44, BH = 50, GAP = 2
  const nPos = cfg.positions
  const totalW = nPos * BW + (nPos - 1) * GAP + 60  // 30px each side for actuator symbols
  const muted = '#94a3b8'
  const green = '#22c55e'
  const amber = '#f59e0b'

  // active position: 0 = de-energized (spring/rest), 1 = coil1 (energized), 2 = coil2 (retracting)
  let activePos = 0
  if (energized && !retracting) activePos = 1
  else if (retracting) activePos = cfg.positions - 1

  const ports = cfg.ports
  const portXs: Record<string, number> = {}
  const spacing = BW / (ports.length + 1)
  ports.forEach((p, i) => { portXs[p] = (i + 1) * spacing })

  const base: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    userSelect: 'none', cursor: 'grab',
    outline: selected ? '2px solid #60a5fa' : 'none', borderRadius: 4,
  }

  const boxStartX = 30  // offset for left actuator

  return (
    <div style={base} onMouseDown={onMouseDown}>
      <svg width={totalW} height={BH + 30}>
        {/* Left actuator (coil 1) */}
        {/* Solenoid box */}
        <rect x={2} y={BH / 2 - 8} width={22} height={16} stroke={energized ? green : muted} strokeWidth={1.5} fill="#1e293b" />
        <line x1={5} y1={BH / 2 - 4} x2={5} y2={BH / 2 + 4} stroke={energized ? green : muted} strokeWidth={1} />
        <line x1={9} y1={BH / 2 - 4} x2={9} y2={BH / 2 + 4} stroke={energized ? green : muted} strokeWidth={1} />
        <line x1={13} y1={BH / 2 - 4} x2={13} y2={BH / 2 + 4} stroke={energized ? green : muted} strokeWidth={1} />
        <line x1={17} y1={BH / 2 - 4} x2={17} y2={BH / 2 + 4} stroke={energized ? green : muted} strokeWidth={1} />
        <line x1={24} y1={BH / 2} x2={boxStartX} y2={BH / 2} stroke={energized ? green : muted} strokeWidth={1.5} />
        <text x={13} y={BH / 2 - 10} textAnchor="middle" fontSize={6} fill={energized ? green : '#64748b'}>SOL</text>

        {/* Right actuator (spring or coil 2) */}
        {cfg.positions === 3 ? (
          <>
            {/* Second solenoid for 5/3 */}
            <rect x={boxStartX + nPos * BW + (nPos - 1) * GAP + 4} y={BH / 2 - 8} width={22} height={16}
              stroke={retracting ? amber : muted} strokeWidth={1.5} fill="#1e293b" />
            {[5, 9, 13, 17].map(ox => (
              <line key={ox} x1={boxStartX + nPos * BW + (nPos - 1) * GAP + 4 + ox - 2} y1={BH / 2 - 4}
                x2={boxStartX + nPos * BW + (nPos - 1) * GAP + 4 + ox - 2} y2={BH / 2 + 4}
                stroke={retracting ? amber : muted} strokeWidth={1} />
            ))}
            <line x1={boxStartX + nPos * BW + (nPos - 1) * GAP} y1={BH / 2}
              x2={boxStartX + nPos * BW + (nPos - 1) * GAP + 4} y2={BH / 2}
              stroke={retracting ? amber : muted} strokeWidth={1.5} />
            <text x={boxStartX + nPos * BW + (nPos - 1) * GAP + 14} y={BH / 2 - 10} textAnchor="middle" fontSize={6} fill={retracting ? amber : '#64748b'}>SOL</text>
          </>
        ) : (
          <>
            {/* Spring return zigzag */}
            {(() => {
              const sx = boxStartX + nPos * BW + (nPos - 1) * GAP + 4
              const sy = BH / 2
              const pts = [sx, sy - 6, sx + 4, sy + 6, sx + 8, sy - 6, sx + 12, sy + 6, sx + 16, sy].map(
                (v, i) => i % 2 === 0 ? v : v
              )
              const d = pts.reduce((acc, v, i) => i === 0 ? `M${v},${BH / 2}` : i % 2 === 0 ? acc + ` L${v},${pts[i + 1] ?? BH / 2}` : acc, '')
              return (
                <>
                  <line x1={boxStartX + nPos * BW + (nPos - 1) * GAP} y1={BH / 2} x2={sx} y2={BH / 2} stroke={muted} strokeWidth={1.5} />
                  <polyline points={[sx, sy, sx + 3, sy - 5, sx + 6, sy + 5, sx + 9, sy - 5, sx + 12, sy + 5, sx + 16, sy].join(',')} fill="none" stroke={muted} strokeWidth={1.5} />
                  <line x1={sx + 16} y1={BH / 2} x2={sx + 20} y2={BH / 2} stroke={muted} strokeWidth={1.5} />
                </>
              )
            })()}
          </>
        )}

        {/* Valve position boxes */}
        {Array.from({ length: nPos }).map((_, pi) => {
          const bx = boxStartX + pi * (BW + GAP)
          const isActive = pi === activePos
          const flowColor = isActive ? (pi > 0 && retracting ? amber : green) : '#334155'
          const flows = cfg.flows[pi] ?? []
          return (
            <g key={pi}>
              <rect x={bx} y={0} width={BW} height={BH}
                stroke={isActive ? (pi > 0 && retracting ? amber : green) : '#475569'}
                strokeWidth={isActive ? 2 : 1} fill={isActive ? '#0f172a' : '#1e293b'} />
              {/* Draw flow paths inside box */}
              {flows.map((flow, fi) => {
                if (flow[0] === 'block') {
                  const px = portXs[flow[1] as string] ?? 0
                  const py = getPortY(flow[1] as string, BH)
                  return (
                    <line key={fi} x1={bx + px - 5} y1={bx === bx ? py + (py < BH / 2 ? 0 : 0) : py}
                      x2={bx + px + 5} y2={py}
                      stroke={flowColor} strokeWidth={2} />
                  )
                }
                const [from, to] = flow as [string, string]
                const fx = portXs[from] ?? 0, fy = getPortY(from, BH)
                const tx = portXs[to] ?? 0, ty = getPortY(to, BH)
                // Arrow midpoint
                const mx = (fx + tx) / 2, my = (fy + ty) / 2
                return (
                  <g key={fi}>
                    <line x1={bx + fx} y1={fy} x2={bx + tx} y2={ty} stroke={flowColor} strokeWidth={1.5} />
                    <polygon points={`${bx + mx},${my - 4} ${bx + mx + 4},${my + 3} ${bx + mx - 4},${my + 3}`}
                      fill={flowColor} />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Port stubs below/above each box (only on active box for clarity) */}
        {ports.map((p, i) => {
          const px = portXs[p] ?? 0
          const py = getPortY(p, BH)
          const isTop = py < BH / 2
          const stubY1 = isTop ? -12 : BH + 12
          const stubY2 = isTop ? 0 : BH
          const activeBx = boxStartX + activePos * (BW + GAP)
          return (
            <g key={p}>
              <line x1={activeBx + px} y1={py === 2 ? 0 : BH} x2={activeBx + px} y2={stubY1} stroke={muted} strokeWidth={1} strokeDasharray="2 2" />
              <text x={activeBx + px} y={isTop ? -14 : BH + 22} textAnchor="middle" fontSize={7} fill={muted}>{p}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>{label}</div>
      {selected && <RemoveBtn onRemove={onRemove} />}
    </div>
  )
}

function RemoveBtn({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onRemove() }}
      style={{
        position: 'absolute', top: -8, right: -8,
        width: 16, height: 16, borderRadius: '50%',
        background: '#ef4444', color: '#fff',
        fontSize: 10, lineHeight: '16px', textAlign: 'center',
        border: 'none', cursor: 'pointer', padding: 0,
      }}
    >×</button>
  )
}

// ---------------------------------------------------------------------------
// Sensor widget (circuit contact elements with playground presence)
// ---------------------------------------------------------------------------

interface SensorWidgetProps {
  el: CircuitElement
  pos: { x: number; y: number }
  energized: boolean
  inZone: boolean
  manualTemp: number
  onMouseDown: (e: React.MouseEvent) => void
  onTempChange: (t: number) => void
}

function SensorWidget({ el, pos, energized, inZone, manualTemp, onMouseDown, onTempChange }: SensorWidgetProps) {
  const label = String(el.params.label || el.type)
  const muted = '#94a3b8'
  const stroke = energized ? '#22c55e' : muted

  if (el.type === 'proximity_no' || el.type === 'proximity_nc') {
    return (
      <div style={{ position: 'absolute', left: pos.x, top: pos.y, userSelect: 'none', cursor: 'grab' }} onMouseDown={onMouseDown}>
        <svg width={80} height={70}>
          <circle cx={40} cy={30} r={PROX_RANGE} fill={inZone ? '#f59e0b11' : 'none'} stroke={inZone ? '#f59e0b55' : '#1e3a5f55'} strokeWidth={2} strokeDasharray="5 3" />
          <rect x={16} y={16} width={48} height={28} rx={5} stroke={inZone ? '#f59e0b' : stroke} strokeWidth={2} fill="#1e293b" />
          <text x={40} y={34} textAnchor="middle" fontSize={11} fill={inZone ? '#f59e0b' : stroke} fontWeight="bold">PROX</text>
          <text x={40} y={55} textAnchor="middle" fontSize={8} fill="#64748b">{el.type === 'proximity_no' ? 'NO' : 'NC'}</text>
        </svg>
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>{label}</div>
      </div>
    )
  }

  if (el.type === 'temp_sensor_no' || el.type === 'temp_sensor_nc') {
    const threshold = Number(el.params.threshold ?? 50)
    const active = manualTemp >= threshold
    return (
      <div style={{ position: 'absolute', left: pos.x, top: pos.y, userSelect: 'none', width: 90 }}>
        <svg width={90} height={55} style={{ cursor: 'grab', display: 'block' }} onMouseDown={onMouseDown}>
          <rect x={38} y={4} width={14} height={32} rx={4} stroke={active ? '#ef4444' : muted} strokeWidth={2} fill="#1e293b" />
          <circle cx={45} cy={38} r={9} stroke={active ? '#ef4444' : muted} strokeWidth={2} fill={active ? '#7f1d1d' : '#1e293b'} />
          <rect x={41} y={18} width={8} height={24} rx={1} fill={active ? '#ef4444' : '#334155'} />
          <text x={45} y={14} textAnchor="middle" fontSize={7} fill={active ? '#ef4444' : muted}>{manualTemp}°</text>
        </svg>
        <div style={{ fontSize: 9, color: active ? '#ef4444' : '#64748b', textAlign: 'center' }}>{manualTemp}°C / {threshold}°C</div>
        <input
          type="range" min={0} max={100} value={manualTemp}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onTempChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: active ? '#ef4444' : '#3b82f6', display: 'block' }}
        />
        <div style={{ fontSize: 8, color: '#64748b', textAlign: 'center' }}>{label}</div>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Device config panel
// ---------------------------------------------------------------------------

interface DeviceConfigProps {
  dev: PlaygroundDevice
  coilCandidates: CircuitElement[]
  onChange: (updates: Partial<Omit<PlaygroundDevice, 'id' | 'deviceType'>>) => void
  onRemove: () => void
}

function DeviceConfig({ dev, coilCandidates, onChange, onRemove }: DeviceConfigProps) {
  const sel = 'bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200 w-full'
  const inp = 'bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200 w-full'

  return (
    <div className="border-t border-slate-700 bg-slate-800 px-3 py-2 flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-300">{DEVICE_LABELS[dev.deviceType]}</span>
        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">Remove</button>
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Label</label>
        <input className={inp} value={dev.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="optional" />
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Coil (extend / on)</label>
        <select className={sel} value={dev.coil_id} onChange={(e) => onChange({ coil_id: e.target.value })}>
          <option value="">— none —</option>
          {coilCandidates.map((c) => (
            <option key={c.id} value={c.id}>{String(c.params.label || c.id)}</option>
          ))}
        </select>
      </div>

      {(dev.deviceType === 'air_cylinder_da' || dev.deviceType === 'motor_3ph' || dev.deviceType === 'valve_42' || dev.deviceType === 'valve_52' || dev.deviceType === 'valve_53') && (
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-400">
            {dev.deviceType === 'motor_3ph' ? 'Reverse coil' : dev.deviceType === 'valve_53' ? 'Pos 3 coil' : 'Retract coil'}
          </label>
          <select className={sel} value={dev.retract_coil_id} onChange={(e) => onChange({ retract_coil_id: e.target.value })}>
            <option value="">— none —</option>
            {coilCandidates.map((c) => (
              <option key={c.id} value={c.id}>{String(c.params.label || c.id)}</option>
            ))}
          </select>
        </div>
      )}

      {(dev.deviceType === 'linear_piston' || dev.deviceType === 'air_cylinder_sa' || dev.deviceType === 'air_cylinder_da') && (
        <div className="flex gap-2">
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-xs text-slate-400">Direction</label>
            <select className={sel} value={dev.direction} onChange={(e) => onChange({ direction: e.target.value as 'right' | 'left' | 'up' | 'down' })}>
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-xs text-slate-400">Extension (px)</label>
            <input className={inp} type="number" min={10} max={300} value={dev.extension}
              onChange={(e) => onChange({ extension: Number(e.target.value) })} />
          </div>
        </div>
      )}

      {dev.deviceType === 'linear_piston' && (
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={dev.sticky} onChange={(e) => onChange({ sticky: e.target.checked })} />
          Sticky (don't retract)
        </label>
      )}
    </div>
  )
}
