import React from 'react'

interface Props {
  energized: boolean
  output_active?: boolean
  remaining?: number
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function OffDelayTimer({ energized, output_active = false, remaining, label = '' }: Props) {
  const stroke = output_active ? '#22c55e' : energized ? '#eab308' : '#94a3b8'
  const fill = output_active ? '#14532d' : 'none'
  return (
    <g>
      <line x1={0} y1={20} x2={10} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={50} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <rect x={10} y={8} width={40} height={24} rx={4} stroke={stroke} strokeWidth={2} fill={fill} />
      <text x={30} y={19} textAnchor="middle" fontSize={7} fill={stroke} fontWeight="bold">OFF-DLY</text>
      {remaining !== undefined && !energized && output_active && (
        <text x={30} y={28} textAnchor="middle" fontSize={8} fill={stroke}>{remaining.toFixed(1)}s</text>
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
