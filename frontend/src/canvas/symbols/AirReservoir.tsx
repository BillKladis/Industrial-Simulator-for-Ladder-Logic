import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export function AirReservoir({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={8} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={52} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* tank: rounded rect */}
      <rect x={8} y={8} width={44} height={24} rx={8} stroke={stroke} strokeWidth={2} fill="#1e293b" />
      {/* P label */}
      <text x={30} y={23} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="bold">P</text>
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>}
    </g>
  )
}
