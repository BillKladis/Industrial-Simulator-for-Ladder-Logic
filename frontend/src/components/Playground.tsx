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
        onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedDevId(null) }}
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

function PhaseContact({ cx, cy, closed, phaseColor, activeColor }: {
  cx: number; cy: number; closed: boolean; phaseColor: string; activeColor: string
}) {
  const c = closed ? activeColor : phaseColor
  return (
    <g>
      <line x1={cx} y1={cy - 9} x2={cx} y2={cy - 4} stroke={c} strokeWidth={1.5} />
      {closed
        ? <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke={activeColor} strokeWidth={2} />
        : <line x1={cx - 5} y1={cy - 2} x2={cx + 5} y2={cy - 7} stroke={c} strokeWidth={1.5} />
      }
      <line x1={cx} y1={cy + 4} x2={cx} y2={cy + 9} stroke={c} strokeWidth={1.5} />
    </g>
  )
}

function Motor3PhWidget({ dev, pos, energized, retracting, selected, onMouseDown, onRemove }: PgWidgetProps) {
  const label = dev.label || DEVICE_LABELS[dev.deviceType]
  const RC = '#ef4444', SC = '#eab308', TC = '#3b82f6'
  const MUTED = '#475569', GREEN = '#22c55e', AMBER = '#f59e0b', RED_C = '#ef4444'
  const fwd = energized
  const rev = retracting && !energized
  const fault = energized && retracting
  const running = fwd || rev
  const hasRev = !!dev.retract_coil_id

  const W = 130
  const xR = 22, xS = 65, xT = 108
  const yBus = 15
  const yC1Top = 24, yC1Mid = 37, yC1Bot = 50
  const yC2Top = 53, yC2Mid = 66, yC2Bot = 79
  const yMotorTop = hasRev ? 82 : 52
  const yMotorCy = hasRev ? 114 : 97
  const H = hasRev ? 150 : 124
  const rMotor = 24

  const c1Color = fwd ? GREEN : MUTED
  const c2Color = rev ? AMBER : MUTED
  const motorColor = fault ? RED_C : running ? (rev ? AMBER : GREEN) : MUTED

  return (
    <div
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        userSelect: 'none', cursor: 'grab',
        outline: selected ? '2px solid #60a5fa' : 'none', borderRadius: 4,
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <svg width={W} height={H}>
        <defs>
          <marker id="mArrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill={rev ? AMBER : GREEN} />
          </marker>
        </defs>
        {/* RST bus bar */}
        <line x1={xR - 6} y1={yBus} x2={xT + 6} y2={yBus} stroke={MUTED} strokeWidth={1.5} />
        <text x={xR} y={11} textAnchor="middle" fontSize={8} fill={RC} fontWeight="bold">R</text>
        <text x={xS} y={11} textAnchor="middle" fontSize={8} fill={SC} fontWeight="bold">S</text>
        <text x={xT} y={11} textAnchor="middle" fontSize={8} fill={TC} fontWeight="bold">T</text>
        {/* Drops from bus to C1 */}
        <line x1={xR} y1={yBus} x2={xR} y2={yC1Top} stroke={RC} strokeWidth={2} />
        <line x1={xS} y1={yBus} x2={xS} y2={yC1Top} stroke={SC} strokeWidth={2} />
        <line x1={xT} y1={yBus} x2={xT} y2={yC1Top} stroke={TC} strokeWidth={2} />
        {/* C1 contact box (forward) */}
        <rect x={8} y={yC1Top} width={W - 16} height={yC1Bot - yC1Top}
          stroke={c1Color} strokeWidth={1} fill="#1e293b" rx={2} />
        <text x={W / 2} y={yC1Top - 1} textAnchor="middle" fontSize={6} fill={c1Color}>C1 FWD</text>
        <PhaseContact cx={xR} cy={yC1Mid} closed={fwd} phaseColor={RC} activeColor={GREEN} />
        <PhaseContact cx={xS} cy={yC1Mid} closed={fwd} phaseColor={SC} activeColor={GREEN} />
        <PhaseContact cx={xT} cy={yC1Mid} closed={fwd} phaseColor={TC} activeColor={GREEN} />
        {/* Wires from C1 */}
        <line x1={xR} y1={yC1Bot} x2={xR} y2={hasRev ? yC2Top : yMotorTop} stroke={fwd ? RC : MUTED} strokeWidth={fwd ? 2 : 1} />
        <line x1={xS} y1={yC1Bot} x2={xS} y2={hasRev ? yC2Top : yMotorTop} stroke={fwd ? SC : MUTED} strokeWidth={fwd ? 2 : 1} />
        <line x1={xT} y1={yC1Bot} x2={xT} y2={hasRev ? yC2Top : yMotorTop} stroke={fwd ? TC : MUTED} strokeWidth={fwd ? 2 : 1} />
        {hasRev && <>
          {/* C2 contact box (reverse) */}
          <rect x={8} y={yC2Top} width={W - 16} height={yC2Bot - yC2Top}
            stroke={c2Color} strokeWidth={1} fill="#1e293b" rx={2} />
          <text x={W / 2} y={yC2Top - 1} textAnchor="middle" fontSize={6} fill={c2Color}>C2 REV</text>
          <PhaseContact cx={xR} cy={yC2Mid} closed={rev} phaseColor={RC} activeColor={AMBER} />
          <PhaseContact cx={xS} cy={yC2Mid} closed={rev} phaseColor={SC} activeColor={AMBER} />
          <PhaseContact cx={xT} cy={yC2Mid} closed={rev} phaseColor={TC} activeColor={AMBER} />
          {rev ? <>
            {/* Phase crossover: R→W, S→V, T→U (R and T swap) */}
            <line x1={xR} y1={yC2Bot} x2={xT} y2={yMotorTop} stroke={RC} strokeWidth={2} />
            <line x1={xS} y1={yC2Bot} x2={xS} y2={yMotorTop} stroke={SC} strokeWidth={2} />
            <line x1={xT} y1={yC2Bot} x2={xR} y2={yMotorTop} stroke={TC} strokeWidth={2} />
          </> : <>
            <line x1={xR} y1={yC2Bot} x2={xR} y2={yMotorTop} stroke={MUTED} strokeWidth={1} />
            <line x1={xS} y1={yC2Bot} x2={xS} y2={yMotorTop} stroke={MUTED} strokeWidth={1} />
            <line x1={xT} y1={yC2Bot} x2={xT} y2={yMotorTop} stroke={MUTED} strokeWidth={1} />
          </>}
        </>}
        {/* Motor terminal bar + UVW labels */}
        <line x1={xR - 6} y1={yMotorTop} x2={xT + 6} y2={yMotorTop} stroke={MUTED} strokeWidth={1.5} />
        <text x={xR} y={yMotorTop + 9} textAnchor="middle" fontSize={6} fill={MUTED}>U</text>
        <text x={xS} y={yMotorTop + 9} textAnchor="middle" fontSize={6} fill={MUTED}>V</text>
        <text x={xT} y={yMotorTop + 9} textAnchor="middle" fontSize={6} fill={MUTED}>W</text>
        {/* Motor body */}
        <circle cx={W / 2} cy={yMotorCy} r={rMotor} stroke={motorColor} strokeWidth={2} fill="#1e293b" />
        <text x={W / 2} y={yMotorCy - 3} textAnchor="middle" fontSize={11} fill={running ? '#fff' : MUTED} fontWeight="bold">M</text>
        <text x={W / 2} y={yMotorCy + 10} textAnchor="middle" fontSize={8} fill={running ? '#fff' : MUTED}>3~</text>
        {/* Rotation arc */}
        {running && !fault && (
          <path
            d={fwd
              ? `M${W / 2 - rMotor + 5},${yMotorCy} A${rMotor - 5},${rMotor - 5} 0 0,1 ${W / 2 + rMotor - 5},${yMotorCy}`
              : `M${W / 2 + rMotor - 5},${yMotorCy} A${rMotor - 5},${rMotor - 5} 0 0,1 ${W / 2 - rMotor + 5},${yMotorCy}`}
            fill="none" stroke={rev ? AMBER : GREEN} strokeWidth={2.5} markerEnd="url(#mArrow)"
          />
        )}
        {fault && (
          <text x={W / 2} y={yMotorCy + 34} textAnchor="middle" fontSize={9} fill={RED_C} fontWeight="bold">FAULT!</text>
        )}
      </svg>
      <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>{label}</div>
      {selected && <RemoveBtn onRemove={onRemove} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Valve widget — ISO 1219 directional control valve notation
// ---------------------------------------------------------------------------

const V_BW = 38, V_BH = 50, V_GAP = 3, V_STUB = 20
const V_AL = 30, V_AR = 30   // actuator area width on each side

const VALVE_PORT_POS: Record<string, Record<string, { x: number; y: number }>> = {
  valve_22: { P: { x: 19, y: V_BH - 2 }, A: { x: 19, y: 2 } },
  valve_32: { A: { x: 19, y: 2 }, P: { x: 10, y: V_BH - 2 }, T: { x: 28, y: V_BH - 2 } },
  valve_42: { A: { x: 12, y: 2 }, B: { x: 26, y: 2 }, P: { x: 19, y: V_BH - 2 }, T: { x: 29, y: V_BH - 2 } },
  valve_52: { A: { x: 11, y: 2 }, B: { x: 27, y: 2 }, T1: { x: 4, y: V_BH - 2 }, P: { x: 19, y: V_BH - 2 }, T2: { x: 34, y: V_BH - 2 } },
  valve_53: { A: { x: 11, y: 2 }, B: { x: 27, y: 2 }, T1: { x: 4, y: V_BH - 2 }, P: { x: 19, y: V_BH - 2 }, T2: { x: 34, y: V_BH - 2 } },
}

type VFlowDef = { type: 'connect'; from: string; to: string } | { type: 'block'; port: string }

const VALVE_FLOWS: Record<string, VFlowDef[][]> = {
  valve_22: [
    [{ type: 'block', port: 'P' }, { type: 'block', port: 'A' }],
    [{ type: 'connect', from: 'P', to: 'A' }],
  ],
  valve_32: [
    [{ type: 'connect', from: 'A', to: 'T' }, { type: 'block', port: 'P' }],
    [{ type: 'connect', from: 'P', to: 'A' }],
  ],
  valve_42: [
    [{ type: 'connect', from: 'P', to: 'A' }, { type: 'connect', from: 'B', to: 'T' }],
    [{ type: 'connect', from: 'P', to: 'B' }, { type: 'connect', from: 'A', to: 'T' }],
  ],
  valve_52: [
    [{ type: 'connect', from: 'P', to: 'A' }, { type: 'connect', from: 'B', to: 'T1' }],
    [{ type: 'connect', from: 'P', to: 'B' }, { type: 'connect', from: 'A', to: 'T2' }],
  ],
  valve_53: [
    [{ type: 'connect', from: 'P', to: 'A' }, { type: 'connect', from: 'B', to: 'T1' }],
    [{ type: 'block', port: 'P' }, { type: 'block', port: 'A' }, { type: 'block', port: 'B' }],
    [{ type: 'connect', from: 'P', to: 'B' }, { type: 'connect', from: 'A', to: 'T2' }],
  ],
}

function vArrow(x1: number, y1: number, x2: number, y2: number, s = 5): string {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return `${x2},${y2} ${x2},${y2} ${x2},${y2}`
  const dx = (x2 - x1) / len, dy = (y2 - y1) / len
  const ax = x2 - dx * s - dy * s / 2, ay = y2 - dy * s + dx * s / 2
  const bx = x2 - dx * s + dy * s / 2, by = y2 - dy * s - dx * s / 2
  return `${x2},${y2} ${ax},${ay} ${bx},${by}`
}

function ValveWidget({ dev, pos, energized, retracting, selected, onMouseDown, onRemove }: PgWidgetProps) {
  const label = dev.label || DEVICE_LABELS[dev.deviceType]
  const ports = VALVE_PORT_POS[dev.deviceType]
  const flows = VALVE_FLOWS[dev.deviceType]
  if (!ports || !flows) return null

  const nPos = flows.length
  const GREEN = '#22c55e', AMBER = '#f59e0b', MUTED = '#475569', DIM = '#334155'

  let activePos = 0
  if (energized && !retracting) activePos = 1
  else if (retracting) activePos = nPos - 1

  const activeColor = activePos === 0 ? MUTED
    : (retracting && activePos === nPos - 1 ? AMBER : GREEN)
  const sol1Color = energized ? GREEN : MUTED
  const sol2Color = retracting ? AMBER : MUTED

  const yBoxTop = V_STUB
  const yBoxMid = V_STUB + V_BH / 2
  const W = V_AL + nPos * (V_BW + V_GAP) + V_AR
  const H = V_STUB + V_BH + V_STUB + 10

  const boxX = (pi: number) => V_AL + pi * (V_BW + V_GAP)
  const activeBoxX = boxX(activePos)

  // Spring zigzag points for right actuator
  const springStartX = V_AL + nPos * (V_BW + V_GAP) + 3
  const springPts = Array.from({ length: 8 }, (_, i) =>
    `${springStartX + i * 3},${yBoxMid + (i % 2 === 0 ? -5 : 5)}`
  ).join(' ')

  return (
    <div
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        userSelect: 'none', cursor: 'grab',
        outline: selected ? '2px solid #60a5fa' : 'none', borderRadius: 4,
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <svg width={W} height={H}>
        {/* ── Left actuator: solenoid 1 ── */}
        <rect x={2} y={yBoxMid - 9} width={22} height={18} stroke={sol1Color} strokeWidth={1.5} fill="#1e293b" />
        {[4, 8, 12, 16].map(ox => (
          <line key={ox} x1={2 + ox} y1={yBoxMid - 5} x2={2 + ox} y2={yBoxMid + 5} stroke={sol1Color} strokeWidth={1} />
        ))}
        <line x1={24} y1={yBoxMid} x2={V_AL} y2={yBoxMid} stroke={sol1Color} strokeWidth={1.5} />
        <text x={13} y={yBoxMid - 11} textAnchor="middle" fontSize={6} fill={sol1Color}>SOL1</text>

        {/* ── Right actuator: spring (2-pos) or solenoid 2 (3-pos) ── */}
        {nPos === 3 ? (
          <>
            <line x1={V_AL + nPos * (V_BW + V_GAP)} y1={yBoxMid} x2={W - 24} y2={yBoxMid} stroke={sol2Color} strokeWidth={1.5} />
            <rect x={W - 24} y={yBoxMid - 9} width={22} height={18} stroke={sol2Color} strokeWidth={1.5} fill="#1e293b" />
            {[2, 6, 10, 14].map(ox => (
              <line key={ox} x1={W - 24 + ox} y1={yBoxMid - 5} x2={W - 24 + ox} y2={yBoxMid + 5} stroke={sol2Color} strokeWidth={1} />
            ))}
            <text x={W - 13} y={yBoxMid - 11} textAnchor="middle" fontSize={6} fill={sol2Color}>SOL2</text>
          </>
        ) : (
          <>
            <line x1={V_AL + nPos * (V_BW + V_GAP)} y1={yBoxMid} x2={springStartX} y2={yBoxMid} stroke={MUTED} strokeWidth={1.5} />
            <polyline points={springPts} fill="none" stroke={MUTED} strokeWidth={1.5} />
            <line x1={springStartX + 24} y1={yBoxMid - 7} x2={springStartX + 24} y2={yBoxMid + 7} stroke={MUTED} strokeWidth={2} />
          </>
        )}

        {/* ── Valve position boxes ── */}
        {Array.from({ length: nPos }).map((_, pi) => {
          const bx = boxX(pi)
          const isActive = pi === activePos
          const fc = isActive ? activeColor : DIM
          const boxFlows = flows[pi] ?? []
          return (
            <g key={pi}>
              <rect x={bx} y={yBoxTop} width={V_BW} height={V_BH}
                stroke={isActive ? activeColor : MUTED}
                strokeWidth={isActive ? 2 : 1}
                fill={isActive ? '#0f172a' : '#1e293b'}
              />
              {boxFlows.map((step, si) => {
                if (step.type === 'block') {
                  const p = ports[step.port]
                  if (!p) return null
                  const ax = bx + p.x, ay = yBoxTop + p.y
                  const isTop = p.y <= 2
                  const barY = ay + (isTop ? 5 : -5)
                  return <line key={si} x1={ax - 7} y1={barY} x2={ax + 7} y2={barY} stroke={fc} strokeWidth={2.5} />
                }
                const from = ports[step.from], to = ports[step.to]
                if (!from || !to) return null
                const fx = bx + from.x, fy = yBoxTop + from.y
                const tx = bx + to.x, ty = yBoxTop + to.y
                return (
                  <g key={si}>
                    <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={fc} strokeWidth={1.5} />
                    <polygon points={vArrow(fx, fy, tx, ty)} fill={fc} />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* ── Port stubs on active box ── */}
        {Object.entries(ports).map(([name, p]) => {
          const ax = activeBoxX + p.x
          const isTop = p.y <= 2
          const absPortY = yBoxTop + p.y
          return (
            <g key={name}>
              {isTop ? (
                <>
                  <line x1={ax} y1={absPortY} x2={ax} y2={V_STUB - 4} stroke={activeColor} strokeWidth={1.5} />
                  <text x={ax} y={V_STUB - 6} textAnchor="middle" fontSize={7} fill={activeColor}>{name}</text>
                </>
              ) : (
                <>
                  <line x1={ax} y1={absPortY} x2={ax} y2={V_STUB + V_BH + 5} stroke={activeColor} strokeWidth={1.5} />
                  <text x={ax} y={V_STUB + V_BH + 14} textAnchor="middle" fontSize={7} fill={activeColor}>{name}</text>
                </>
              )}
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
