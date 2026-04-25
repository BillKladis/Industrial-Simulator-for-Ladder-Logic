import React from 'react'

interface Props {
  energized: boolean
  normallyOpen: boolean
  label?: string
}

export function ProximitySensor({ energized, normallyOpen, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  return (
    <g>
      <line x1={0} y1={20} x2={15} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={45} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* contact bar */}
      <line x1={15} y1={13} x2={45} y2={13} stroke={stroke} strokeWidth={2.5} />
      <line x1={15} y1={13} x2={15} y2={27} stroke={stroke} strokeWidth={2} />
      <line x1={45} y1={13} x2={45} y2={27} stroke={stroke} strokeWidth={2} />
      {!normallyOpen && (
        <line x1={15} y1={27} x2={45} y2={13} stroke={stroke} strokeWidth={1.5} strokeDasharray="3,2" />
      )}
      {/* proximity "sensing" arcs above */}
      <path d="M24,9 Q30,4 36,9" stroke={energized ? '#fbbf24' : '#64748b'} strokeWidth={1.5} fill="none" />
      <path d="M21,6 Q30,0 39,6" stroke={energized ? '#fbbf24' : '#475569'} strokeWidth={1} fill="none" />
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>}
    </g>
  )
}
