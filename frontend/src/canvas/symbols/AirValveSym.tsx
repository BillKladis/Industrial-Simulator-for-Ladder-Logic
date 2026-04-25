import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export function AirValveSym({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#14532d' : 'none'
  return (
    <g>
      <line x1={0} y1={20} x2={13} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={47} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* valve body: two triangles (flow symbol) */}
      <polygon points="13,12 13,28 27,20" stroke={stroke} strokeWidth={2} fill={fill} />
      <polygon points="47,12 47,28 33,20" stroke={stroke} strokeWidth={2} fill={fill} />
      {/* solenoid operator on top */}
      <rect x={24} y={2} width={12} height={7} stroke={stroke} strokeWidth={1.5} fill={energized ? '#14532d' : 'none'} rx={1} />
      <line x1={30} y1={9} x2={30} y2={12} stroke={stroke} strokeWidth={1.5} />
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>}
    </g>
  )
}
