import React from 'react'

interface Props {
  energized: boolean
  normallyOpen: boolean
  label?: string
  pressed?: boolean
}

// Port offsets relative to element origin (0,0)
export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }
const W = 60, H = 40

export function PushButton({ energized, normallyOpen, label = '', pressed = false }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const lineY = normallyOpen ? 28 : 12

  return (
    <g>
      {/* left stub */}
      <line x1={0} y1={20} x2={18} y2={20} stroke={stroke} strokeWidth={2} />
      {/* right stub */}
      <line x1={42} y1={20} x2={W} y2={20} stroke={stroke} strokeWidth={2} />
      {/* contact bar */}
      <line
        x1={18} y1={lineY} x2={42} y2={lineY}
        stroke={stroke} strokeWidth={2.5}
        transform={pressed && normallyOpen ? `translate(0,${-lineY + 20})` : undefined}
      />
      {/* actuator stem */}
      <line x1={30} y1={lineY} x2={30} y2={6} stroke={stroke} strokeWidth={1.5} />
      {/* actuator button */}
      <rect x={22} y={2} width={16} height={5} rx={2} fill={pressed ? '#22c55e' : '#475569'} />
      {/* label */}
      {label && (
        <text x={30} y={H - 2} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
