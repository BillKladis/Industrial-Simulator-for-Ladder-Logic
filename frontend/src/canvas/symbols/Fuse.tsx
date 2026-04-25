import React from 'react'

interface Props {
  energized: boolean
  blown?: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function Fuse({ energized, blown = false, label = '' }: Props) {
  const stroke = blown ? '#ef4444' : energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={14} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={46} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <rect x={14} y={12} width={32} height={16} rx={3} stroke={stroke} strokeWidth={2}
        fill={blown ? '#450a0a' : 'none'} />
      {blown ? (
        <line x1={20} y1={20} x2={40} y2={20} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" />
      ) : (
        <line x1={14} y1={20} x2={46} y2={20} stroke={stroke} strokeWidth={2} />
      )}
      {label && (
        <text x={30} y={36} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
