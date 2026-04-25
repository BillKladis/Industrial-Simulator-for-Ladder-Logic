import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function Lamp({ energized, label = '' }: Props) {
  const color = energized ? '#fbbf24' : '#475569'
  return (
    <g>
      <line x1={0} y1={20} x2={15} y2={20} stroke={energized ? '#22c55e' : '#94a3b8'} strokeWidth={2} />
      <line x1={45} y1={20} x2={60} y2={20} stroke={energized ? '#22c55e' : '#94a3b8'} strokeWidth={2} />
      <circle cx={30} cy={20} r={14} stroke={color} strokeWidth={2}
        fill={energized ? '#78350f' : 'none'} />
      {/* X cross inside */}
      <line x1={20} y1={10} x2={40} y2={30} stroke={color} strokeWidth={2} />
      <line x1={40} y1={10} x2={20} y2={30} stroke={color} strokeWidth={2} />
      {energized && (
        <circle cx={30} cy={20} r={14} stroke="none" fill="#fbbf24" fillOpacity={0.3} />
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
