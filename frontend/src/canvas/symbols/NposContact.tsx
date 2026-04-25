import React from 'react'

interface Props {
  energized: boolean
  normallyOpen: boolean
  label?: string
  closeAt?: number
  leverPosition?: number
}

export function NposContact({ energized, normallyOpen, label = '', closeAt = 0, leverPosition = -1 }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const dimColor = '#64748b'

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
      {/* position indicator: shows "pos/total" above the contact */}
      <text x={30} y={9} textAnchor="middle" fontSize={8} fill={energized ? '#f59e0b' : dimColor} fontWeight="bold">
        @{closeAt}
      </text>
      {leverPosition >= 0 && (
        <text x={30} y={3} textAnchor="middle" fontSize={7} fill={leverPosition === closeAt ? '#22c55e' : dimColor}>
          ={leverPosition}
        </text>
      )}
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>}
    </g>
  )
}
