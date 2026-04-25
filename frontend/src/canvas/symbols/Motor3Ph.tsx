import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 30 }, b: { x: 60, y: 30 } }
// Motor is taller
export const MOTOR_H = 60

export function Motor3Ph({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#14532d' : 'none'
  return (
    <g>
      <line x1={0} y1={30} x2={12} y2={30} stroke={stroke} strokeWidth={2} />
      <line x1={48} y1={30} x2={60} y2={30} stroke={stroke} strokeWidth={2} />
      <circle cx={30} cy={30} r={18} stroke={stroke} strokeWidth={2} fill={fill} />
      <text x={30} y={28} textAnchor="middle" fontSize={9} fill={stroke} fontWeight="bold">3~</text>
      <text x={30} y={38} textAnchor="middle" fontSize={7} fill={stroke}>M</text>
      {energized && (
        // spinning indicator — simple arc
        <circle cx={30} cy={30} r={10} stroke="#4ade80" strokeWidth={1.5}
          fill="none" strokeDasharray="15,10" strokeDashoffset="0">
        </circle>
      )}
      {label && (
        <text x={30} y={54} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
