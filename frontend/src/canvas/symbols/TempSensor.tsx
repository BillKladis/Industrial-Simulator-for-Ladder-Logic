import React from 'react'

interface Props {
  energized: boolean
  normallyOpen: boolean
  label?: string
}

export function TempSensor({ energized, normallyOpen, label = '' }: Props) {
  const stroke = energized ? '#22c55e' : '#94a3b8'
  const tColor = energized ? '#f87171' : '#64748b'
  return (
    <g>
      <line x1={0} y1={20} x2={15} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={45} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={15} y1={13} x2={45} y2={13} stroke={stroke} strokeWidth={2.5} />
      <line x1={15} y1={13} x2={15} y2={27} stroke={stroke} strokeWidth={2} />
      <line x1={45} y1={13} x2={45} y2={27} stroke={stroke} strokeWidth={2} />
      {!normallyOpen && (
        <line x1={15} y1={27} x2={45} y2={13} stroke={stroke} strokeWidth={1.5} strokeDasharray="3,2" />
      )}
      {/* thermometer bulb + stem above contact */}
      <circle cx={30} cy={7} r={4} stroke={tColor} strokeWidth={1.5} fill={energized ? '#fca5a5' : 'none'} />
      <line x1={30} y1={3} x2={30} y2={0} stroke={tColor} strokeWidth={1.5} />
      <text x={34} y={4} fontSize={7} fill={tColor} fontWeight="bold">T°</text>
      {label && <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>}
    </g>
  )
}
