import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function RelayCoil({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#14532d' : 'none'
  return (
    <g>
      <line x1={0} y1={20} x2={15} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={45} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <circle cx={30} cy={20} r={15} stroke={stroke} strokeWidth={2} fill={fill} />
      {label && (
        <text x={30} y={24} textAnchor="middle" fontSize={10} fill={energized ? '#4ade80' : '#94a3b8'}
          fontWeight="bold">{label}</text>
      )}
    </g>
  )
}
