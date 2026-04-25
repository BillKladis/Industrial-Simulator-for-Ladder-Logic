import React from 'react'

interface Props {
  energized: boolean
  actuated?: boolean
  normallyOpen?: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function LimitSwitch({ energized, actuated = false, normallyOpen = true, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const barY = normallyOpen ? (actuated ? 20 : 12) : (actuated ? 12 : 20)
  return (
    <g>
      <line x1={0} y1={20} x2={18} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={42} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={18} y1={barY} x2={42} y2={barY} stroke={stroke} strokeWidth={2.5} />
      <line x1={18} y1={barY} x2={18} y2={28} stroke={stroke} strokeWidth={2} />
      <line x1={42} y1={barY} x2={42} y2={28} stroke={stroke} strokeWidth={2} />
      {/* roller actuator */}
      <circle cx={30} cy={8} r={4} stroke={stroke} strokeWidth={1.5} fill={actuated ? '#22c55e' : 'none'} />
      <line x1={30} y1={12} x2={30} y2={barY} stroke={stroke} strokeWidth={1.5} />
      {!normallyOpen && (
        <line x1={22} y1={28} x2={38} y2={12} stroke={stroke} strokeWidth={1} strokeDasharray="2,2" />
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
