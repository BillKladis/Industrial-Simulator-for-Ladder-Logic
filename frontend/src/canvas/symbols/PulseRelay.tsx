import React from 'react'

interface Props {
  energized: boolean
  pulsing?: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function PulseRelay({ energized, pulsing = false, label = '' }: Props) {
  const stroke = pulsing ? '#a855f7' : energized ? '#eab308' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={10} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={50} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <rect x={10} y={8} width={40} height={24} rx={4} stroke={stroke} strokeWidth={2}
        fill={pulsing ? '#3b0764' : 'none'} />
      <text x={30} y={19} textAnchor="middle" fontSize={7} fill={stroke} fontWeight="bold">PULSE</text>
      {pulsing && <text x={30} y={28} textAnchor="middle" fontSize={8} fill={stroke}>●</text>}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
