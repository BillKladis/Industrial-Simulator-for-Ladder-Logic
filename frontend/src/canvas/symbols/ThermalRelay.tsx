import React from 'react'

interface Props {
  energized: boolean
  tripped?: boolean
  normallyOpen?: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function ThermalRelay({ energized, tripped = false, normallyOpen = true, label = '' }: Props) {
  const stroke = tripped ? '#ef4444' : energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={14} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={46} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* bimetallic symbol: zigzag */}
      <polyline
        points="14,20 20,14 26,26 32,14 38,26 44,20 46,20"
        fill="none" stroke={stroke} strokeWidth={2}
      />
      {tripped && (
        <text x={30} y={36} textAnchor="middle" fontSize={8} fill="#ef4444">TRIP</text>
      )}
      {!normallyOpen && (
        <line x1={18} y1={28} x2={42} y2={12} stroke={stroke} strokeWidth={1} strokeDasharray="2,2" />
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
