import React from 'react'

interface SAProps {
  energized: boolean
  label?: string
}

export function AirCylinderSA({ energized, label = '' }: SAProps) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const fill = energized ? '#1e3a5f' : '#1e293b'
  return (
    <g>
      <line x1={0} y1={20} x2={8} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={52} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* cylinder barrel */}
      <rect x={8} y={12} width={33} height={16} rx={3} stroke={stroke} strokeWidth={2} fill={fill} />
      {/* left cap */}
      <rect x={8} y={10} width={5} height={20} fill={stroke} rx={1} />
      {/* single air port top-left */}
      <line x1={18} y1={12} x2={18} y2={6} stroke={stroke} strokeWidth={1.5} />
      <circle cx={18} cy={5} r={2.5} fill={energized ? '#22c55e' : '#475569'} />
      {/* piston rod */}
      <rect x={41} y={17} width={11} height={6} fill={stroke} rx={1} />
      {label && <text x={30} y={9} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>}
    </g>
  )
}

interface DAProps {
  energized: boolean
  retracting?: boolean
  label?: string
}

export function AirCylinderDA({ energized, retracting = false, label = '' }: DAProps) {
  const stroke = energized ? '#22c55e' : retracting ? '#f59e0b' : '#94a3b8'
  const fill = '#1e293b'
  return (
    <g>
      <line x1={0} y1={20} x2={6} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={54} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* barrel */}
      <rect x={6} y={12} width={48} height={16} rx={3} stroke={stroke} strokeWidth={2} fill={fill} />
      {/* piston divider */}
      <rect x={26} y={12} width={5} height={16} fill={stroke} opacity={0.7} />
      {/* two air ports */}
      <line x1={16} y1={12} x2={16} y2={6} stroke={energized ? '#22c55e' : '#475569'} strokeWidth={1.5} />
      <circle cx={16} cy={5} r={2.5} fill={energized ? '#22c55e' : '#475569'} />
      <line x1={44} y1={12} x2={44} y2={6} stroke={retracting ? '#f59e0b' : '#475569'} strokeWidth={1.5} />
      <circle cx={44} cy={5} r={2.5} fill={retracting ? '#f59e0b' : '#475569'} />
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>}
    </g>
  )
}
