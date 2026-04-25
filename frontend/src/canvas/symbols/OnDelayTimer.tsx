import React from 'react'

interface Props {
  energized: boolean
  done?: boolean
  remaining?: number
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function OnDelayTimer({ energized, done = false, remaining, label = '' }: Props) {
  const stroke = done ? '#22c55e' : energized ? '#eab308' : '#94a3b8'
  const fill = done ? '#14532d' : energized ? '#422006' : 'none'
  return (
    <g>
      <line x1={0} y1={20} x2={10} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={50} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <rect x={10} y={8} width={40} height={24} rx={4} stroke={stroke} strokeWidth={2} fill={fill} />
      <text x={30} y={19} textAnchor="middle" fontSize={7} fill={stroke} fontWeight="bold">ON-DLY</text>
      {remaining !== undefined && energized && (
        <text x={30} y={28} textAnchor="middle" fontSize={8} fill={stroke}>{remaining.toFixed(1)}s</text>
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
