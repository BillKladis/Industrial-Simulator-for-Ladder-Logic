import React from 'react'

interface Props {
  energized?: boolean
  isR?: boolean   // true = live rail (R/L1), false = neutral (N/L2)
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function RailSymbol({ energized = false, isR = true, label = '' }: Props) {
  const baseColor = isR ? '#ef4444' : '#3b82f6'
  const stroke = energized ? '#22c55e' : baseColor
  const fill = isR ? '#450a0a' : '#172554'
  return (
    <g>
      {/* body */}
      <rect x={4} y={6} width={52} height={28} rx={4} stroke={stroke} strokeWidth={2} fill={fill} />
      {/* output stub */}
      <line x1={0} y1={20} x2={4} y2={20} stroke={stroke} strokeWidth={2.5} />
      <line x1={56} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2.5} />
      {/* label */}
      <text x={30} y={24} textAnchor="middle" fontSize={12} fontWeight="bold" fill={stroke}>
        {label || (isR ? 'L1' : 'N')}
      </text>
    </g>
  )
}
