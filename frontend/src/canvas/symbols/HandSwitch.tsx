import React from 'react'

interface Props {
  energized: boolean
  on?: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function HandSwitch({ energized, on = false, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={18} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={42} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* rotary switch */}
      <circle cx={30} cy={20} r={12} stroke={stroke} strokeWidth={2} fill="none" />
      <line
        x1={30} y1={20}
        x2={30 + 10 * Math.cos(on ? -Math.PI / 4 : Math.PI / 4)}
        y2={20 + 10 * Math.sin(on ? -Math.PI / 4 : Math.PI / 4)}
        stroke={stroke} strokeWidth={2.5}
      />
      {/* terminals */}
      <circle cx={18} cy={20} r={3} fill={stroke} />
      <circle cx={42} cy={20} r={3} fill={stroke} />
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
