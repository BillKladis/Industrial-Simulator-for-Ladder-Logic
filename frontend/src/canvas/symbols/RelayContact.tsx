import React from 'react'

interface Props {
  energized: boolean
  normallyOpen: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function RelayContact({ energized, normallyOpen, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  // NO: bar at y=12 (above center), NC: diagonal line
  return (
    <g>
      <line x1={0} y1={20} x2={18} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={42} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {normallyOpen ? (
        <line x1={18} y1={12} x2={42} y2={12} stroke={stroke} strokeWidth={2.5} />
      ) : (
        <>
          <line x1={18} y1={12} x2={42} y2={12} stroke={stroke} strokeWidth={2.5} />
          <line x1={18} y1={28} x2={42} y2={12} stroke={stroke} strokeWidth={1.5} strokeDasharray="3,2" />
        </>
      )}
      {/* vertical legs */}
      <line x1={18} y1={12} x2={18} y2={28} stroke={stroke} strokeWidth={2} />
      <line x1={42} y1={12} x2={42} y2={28} stroke={stroke} strokeWidth={2} />
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
