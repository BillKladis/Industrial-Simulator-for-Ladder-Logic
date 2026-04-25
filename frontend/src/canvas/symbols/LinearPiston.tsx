import React from 'react'

interface Props {
  energized: boolean
  label?: string
}

export function LinearPiston({ energized, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#14532d' : '#1e293b'
  const rodColor = energized ? '#4ade80' : '#64748b'
  return (
    <g>
      <line x1={0} y1={20} x2={8} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={52} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* cylinder body */}
      <rect x={8} y={11} width={28} height={18} rx={2} stroke={stroke} strokeWidth={2} fill={fill} />
      {/* end cap */}
      <rect x={8} y={10} width={4} height={20} fill={stroke} />
      {/* piston rod */}
      <rect x={36} y={17} width={16} height={6} fill={rodColor} rx={1} />
      {/* arrow tip */}
      <polygon points={`${energized ? 52 : 48},14 ${energized ? 58 : 54},20 ${energized ? 52 : 48},26`} fill={rodColor} />
      {label && (
        <text x={22} y={8} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>
      )}
    </g>
  )
}
