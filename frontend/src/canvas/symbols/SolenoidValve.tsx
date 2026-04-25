import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function SolenoidValve({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#14532d' : 'none'
  return (
    <g>
      <line x1={0} y1={20} x2={10} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={50} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* valve body */}
      <rect x={10} y={10} width={40} height={20} rx={3} stroke={stroke} strokeWidth={2} fill={fill} />
      {/* solenoid coil hatch */}
      <line x1={15} y1={10} x2={15} y2={30} stroke={stroke} strokeWidth={1} />
      <line x1={20} y1={10} x2={20} y2={30} stroke={stroke} strokeWidth={1} />
      <line x1={25} y1={10} x2={25} y2={30} stroke={stroke} strokeWidth={1} />
      <text x={38} y={23} textAnchor="middle" fontSize={8} fill={stroke}>SV</text>
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
