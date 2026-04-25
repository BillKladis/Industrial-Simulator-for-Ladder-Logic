import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export const PORTS = { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

export function Siren({ energized, label = '' }: Props) {
  const stroke = energized ? '#ef4444' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={13} y2={20} stroke={energized ? '#22c55e' : '#94a3b8'} strokeWidth={2} />
      <line x1={47} y1={20} x2={60} y2={20} stroke={energized ? '#22c55e' : '#94a3b8'} strokeWidth={2} />
      {/* Bell / horn shape */}
      <path d="M13,10 Q30,2 47,10 L47,30 Q30,38 13,30 Z"
        stroke={stroke} strokeWidth={2} fill={energized ? '#450a0a' : 'none'} />
      {energized && (
        <>
          <line x1={30} y1={2} x2={30} y2={0} stroke={stroke} strokeWidth={1} />
          <line x1={38} y1={4} x2={41} y2={2} stroke={stroke} strokeWidth={1} />
          <line x1={22} y1={4} x2={19} y2={2} stroke={stroke} strokeWidth={1} />
        </>
      )}
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
