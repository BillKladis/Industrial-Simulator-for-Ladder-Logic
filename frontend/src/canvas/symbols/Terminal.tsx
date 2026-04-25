import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function Terminal({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <rect x={24} y={14} width={12} height={12} rx={2} stroke={stroke} strokeWidth={2}
        fill={energized ? '#14532d' : '#1e293b'} />
      {label && (
        <text x={30} y={36} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
