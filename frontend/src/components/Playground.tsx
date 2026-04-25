import React, { useCallback, useEffect, useRef } from 'react'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import { usePlaygroundStore, PG_W, PG_H, SQ_SIZE } from '../store/playgroundStore'
import type { CircuitElement } from '../types/circuit'

const PLAYGROUND_TYPES = new Set([
  'proximity_no', 'proximity_nc',
  'temp_sensor_no', 'temp_sensor_nc',
  'linear_piston',
  'air_cylinder_sa', 'air_cylinder_da',
  'air_valve', 'air_reservoir',
])

const PROX_RANGE = 70

interface Props {
  send: (msg: Record<string, unknown>) => void
}

export function Playground({ send }: Props) {
  const elements = useCircuitStore((s) => s.elements)
  const elementStates = useSimStore((s) => s.elementStates)
  const { square, placements, manualTemps, moveSquare, setPlacement, initPlacement, setManualTemp } =
    usePlaygroundStore()

  const pgElements = (Object.values(elements) as CircuitElement[]).filter((el) =>
    PLAYGROUND_TYPES.has(el.type)
  )

  const pgIds = pgElements.map((e) => e.id).join(',')
  useEffect(() => {
    pgElements.forEach((el, i) => {
      initPlacement(el.id, 20 + (i % 4) * 110, 380 + Math.floor(i / 4) * 90)
    })
  // initPlacement is stable; pgIds captures identity changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgIds])

  // Track last-sent sensor state to avoid spamming events
  const lastSent = useRef<Record<string, boolean>>({})

  // Proximity detection
  useEffect(() => {
    const sqCx = square.x + SQ_SIZE / 2
    const sqCy = square.y + SQ_SIZE / 2
    pgElements.forEach((el) => {
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

  // Temperature threshold detection
  useEffect(() => {
    pgElements.forEach((el) => {
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

  // Piston push / pull
  const prevPiston = useRef<Record<string, boolean>>({})
  useEffect(() => {
    pgElements.forEach((el) => {
      if (el.type !== 'linear_piston') return
      const state = elementStates.get(el.id)
      const energized = state?.energized ?? false
      const prev = prevPiston.current[el.id] ?? false
      if (energized === prev) return
      prevPiston.current[el.id] = energized
      const dir = String(el.params.direction ?? 'right')
      const ext = Number(el.params.extension ?? 80)
      const sticky = Boolean(el.params.sticky)
      const dx = dir === 'right' ? ext : dir === 'left' ? -ext : 0
      const dy = dir === 'down' ? ext : dir === 'up' ? -ext : 0
      if (energized) {
        moveSquare(square.x + dx, square.y + dy)
      } else if (!sticky) {
        moveSquare(square.x - dx, square.y - dy)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementStates])

  // Dragging
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingSquare, setDraggingSquare] = React.useState(false)
  const [draggingEl, setDraggingEl] = React.useState<string | null>(null)
  const sqOff = useRef({ x: 0, y: 0 })
  const elOff = useRef({ x: 0, y: 0 })

  const onSquareDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      sqOff.current = { x: e.clientX - r.left - square.x, y: e.clientY - r.top - square.y }
      setDraggingSquare(true)
    },
    [square]
  )

  const onElDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const pos = placements[id] ?? { x: 0, y: 0 }
      elOff.current = { x: e.clientX - r.left - pos.x, y: e.clientY - r.top - pos.y }
      setDraggingEl(id)
    },
    [placements]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      if (draggingSquare) moveSquare(cx - sqOff.current.x, cy - sqOff.current.y)
      if (draggingEl) setPlacement(draggingEl, cx - elOff.current.x, cy - elOff.current.y)
    },
    [draggingSquare, draggingEl, moveSquare, setPlacement]
  )

  const onMouseUp = useCallback(() => {
    setDraggingSquare(false)
    setDraggingEl(null)
  }, [])

  return (
    <div
      className="flex flex-col shrink-0 bg-slate-900 border-l border-slate-700"
      style={{ width: PG_W }}
    >
      <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 bg-slate-800">
        Playground
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-slate-950"
        style={{ flex: 1, cursor: draggingSquare || draggingEl ? 'grabbing' : 'default' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Grid */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {Array.from({ length: Math.ceil(PG_W / 20) + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2="100%" stroke="#1e293b" strokeWidth={0.5} />
          ))}
          {Array.from({ length: Math.ceil(PG_H / 20) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 20} x2="100%" y2={i * 20} stroke="#1e293b" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Element widgets */}
        {pgElements.map((el) => {
          const pos = placements[el.id] ?? { x: 20, y: 380 }
          const state = elementStates.get(el.id)
          const energized = state?.energized ?? false
          const sqCx = square.x + SQ_SIZE / 2
          const sqCy = square.y + SQ_SIZE / 2
          const dist = Math.sqrt((sqCx - (pos.x + 30)) ** 2 + (sqCy - (pos.y + 20)) ** 2)
          return (
            <PgWidget
              key={el.id}
              el={el}
              pos={pos}
              energized={energized}
              inZone={dist < PROX_RANGE}
              manualTemp={manualTemps[el.id] ?? 20}
              onMouseDown={(e) => onElDown(e, el.id)}
              onTempChange={(t) => setManualTemp(el.id, t)}
            />
          )
        })}

        {/* No-elements placeholder */}
        {pgElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-600 text-xs text-center px-6">
              Add proximity sensors, temp sensors, pistons or pneumatic elements<br />to the circuit to see them here.
            </p>
          </div>
        )}

        {/* Movable square */}
        <div
          className="absolute rounded border-2 border-blue-400 bg-blue-900/40 flex items-center justify-center select-none"
          style={{ left: square.x, top: square.y, width: SQ_SIZE, height: SQ_SIZE, cursor: 'grab' }}
          onMouseDown={onSquareDown}
        >
          <span className="text-blue-300 text-xs font-bold pointer-events-none">BOX</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-element playground widget
// ---------------------------------------------------------------------------

interface PgWidgetProps {
  el: CircuitElement
  pos: { x: number; y: number }
  energized: boolean
  inZone: boolean
  manualTemp: number
  onMouseDown: (e: React.MouseEvent) => void
  onTempChange: (t: number) => void
}

function PgWidget({ el, pos, energized, inZone, manualTemp, onMouseDown, onTempChange }: PgWidgetProps) {
  const label = String(el.params.label || el.type)
  const green = '#22c55e'
  const muted = '#94a3b8'
  const stroke = energized ? green : muted

  const wrap = (content: React.ReactNode, w = 80, h = 70): React.ReactNode => (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, userSelect: 'none', cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      {content}
      <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 2 }}>{label}</div>
    </div>
  )

  if (el.type === 'proximity_no' || el.type === 'proximity_nc') {
    return (
      <>{wrap(
        <svg width={80} height={70}>
          <circle
            cx={40} cy={30} r={PROX_RANGE}
            fill={inZone ? '#f59e0b11' : 'none'}
            stroke={inZone ? '#f59e0b55' : '#1e3a5f55'}
            strokeWidth={2} strokeDasharray="5 3"
          />
          <rect x={16} y={16} width={48} height={28} rx={5} stroke={inZone ? '#f59e0b' : stroke} strokeWidth={2} fill="#1e293b" />
          <text x={40} y={34} textAnchor="middle" fontSize={11} fill={inZone ? '#f59e0b' : stroke} fontWeight="bold">PROX</text>
          <text x={40} y={55} textAnchor="middle" fontSize={8} fill="#64748b">{el.type === 'proximity_no' ? 'NO' : 'NC'}</text>
        </svg>
      )}</>
    )
  }

  if (el.type === 'temp_sensor_no' || el.type === 'temp_sensor_nc') {
    const threshold = Number(el.params.threshold ?? 50)
    const active = manualTemp >= threshold
    return (
      <div
        style={{ position: 'absolute', left: pos.x, top: pos.y, userSelect: 'none', width: 90 }}
      >
        <svg width={90} height={55} style={{ cursor: 'grab', display: 'block' }} onMouseDown={onMouseDown}>
          <rect x={38} y={4} width={14} height={32} rx={4} stroke={active ? '#ef4444' : muted} strokeWidth={2} fill="#1e293b" />
          <circle cx={45} cy={38} r={9} stroke={active ? '#ef4444' : muted} strokeWidth={2} fill={active ? '#7f1d1d' : '#1e293b'} />
          <rect x={41} y={18} width={8} height={24} rx={1} fill={active ? '#ef4444' : '#334155'} />
          <text x={45} y={14} textAnchor="middle" fontSize={7} fill={active ? '#ef4444' : muted}>
            {manualTemp}°
          </text>
        </svg>
        <div style={{ fontSize: 9, color: active ? '#ef4444' : '#64748b', textAlign: 'center' }}>
          {manualTemp}°C / {threshold}°C
        </div>
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

  if (el.type === 'linear_piston') {
    const rodExt = energized ? Math.min(Number(el.params.extension ?? 80) * 0.4, 52) : 8
    return (
      <>{wrap(
        <svg width={100} height={50}>
          <rect x={4} y={15} width={38} height={20} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={4} y={13} width={7} height={24} fill={stroke} rx={1} />
          <rect x={42} y={19} width={rodExt} height={12} fill={energized ? green : '#334155'} rx={1} />
          {energized && (
            <polygon
              points={`${42 + rodExt},15 ${42 + rodExt + 8},25 ${42 + rodExt},35`}
              fill={green}
            />
          )}
          <text x={23} y={10} textAnchor="middle" fontSize={8} fill={muted}>
            {String(el.params.direction ?? 'right')} {Number(el.params.extension ?? 80)}px
          </text>
        </svg>
      )}</>
    )
  }

  if (el.type === 'air_cylinder_sa') {
    const rodExt = energized ? 30 : 8
    return (
      <>{wrap(
        <svg width={90} height={50}>
          <rect x={4} y={13} width={44} height={24} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={4} y={11} width={7} height={28} fill={stroke} rx={1} />
          <line x1={22} y1={13} x2={22} y2={6} stroke={energized ? green : '#475569'} strokeWidth={1.5} />
          <circle cx={22} cy={4} r={3} fill={energized ? green : '#475569'} />
          <rect x={48} y={18} width={rodExt} height={14} fill={energized ? green : '#334155'} rx={1} />
        </svg>
      )}</>
    )
  }

  if (el.type === 'air_cylinder_da') {
    return (
      <>{wrap(
        <svg width={90} height={50}>
          <rect x={4} y={13} width={60} height={24} rx={3} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <rect x={30} y={13} width={7} height={24} fill={stroke} opacity={0.7} />
          <line x1={18} y1={13} x2={18} y2={6} stroke={energized ? green : '#475569'} strokeWidth={1.5} />
          <circle cx={18} cy={4} r={3} fill={energized ? green : '#475569'} />
          <line x1={52} y1={13} x2={52} y2={6} stroke="#f59e0b55" strokeWidth={1.5} />
          <circle cx={52} cy={4} r={3} fill="#f59e0b44" />
        </svg>
      )}</>
    )
  }

  if (el.type === 'air_valve') {
    const fillCol = energized ? '#14532d' : 'none'
    return (
      <>{wrap(
        <svg width={70} height={50}>
          <polygon points="10,12 10,36 28,24" stroke={stroke} strokeWidth={2} fill={fillCol} />
          <polygon points="60,12 60,36 42,24" stroke={stroke} strokeWidth={2} fill={fillCol} />
          <rect x={28} y={6} width={14} height={9} stroke={stroke} strokeWidth={1.5} fill={fillCol} rx={1} />
          <line x1={35} y1={15} x2={35} y2={18} stroke={stroke} strokeWidth={1.5} />
        </svg>
      )}</>
    )
  }

  if (el.type === 'air_reservoir') {
    return (
      <>{wrap(
        <svg width={80} height={44}>
          <rect x={4} y={8} width={72} height={28} rx={10} stroke={stroke} strokeWidth={2} fill="#1e293b" />
          <text x={40} y={26} textAnchor="middle" fontSize={14} fill={stroke} fontWeight="bold">P</text>
        </svg>
      )}</>
    )
  }

  return null
}
