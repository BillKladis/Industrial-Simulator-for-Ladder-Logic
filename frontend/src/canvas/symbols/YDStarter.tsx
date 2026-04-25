import React from 'react'

interface Props {
  energized: boolean
  mode?: 'off' | 'star' | 'delta'
  remaining?: number
  label?: string
}

export const PORTS = { a: { x: 0, y: 30 }, b: { x: 80, y: 30 } }
export const YD_W = 80
export const YD_H = 60

export function YDStarter({ energized, mode = 'off', remaining, label = '' }: Props) {
  const stroke = mode === 'delta' ? '#22c55e' : mode === 'star' ? '#eab308' : '#94a3b8'
  const modeLabel = mode === 'star' ? 'Y' : mode === 'delta' ? 'Δ' : '—'
  return (
    <g>
      <line x1={0} y1={30} x2={10} y2={30} stroke={stroke} strokeWidth={2} />
      <line x1={70} y1={30} x2={80} y2={30} stroke={stroke} strokeWidth={2} />
      <rect x={10} y={8} width={60} height={44} rx={5} stroke={stroke} strokeWidth={2}
        fill={energized ? '#0c1a10' : 'none'} />
      <text x={40} y={24} textAnchor="middle" fontSize={9} fill={stroke} fontWeight="bold">Y-Δ</text>
      <text x={40} y={36} textAnchor="middle" fontSize={18} fill={stroke} fontWeight="bold">{modeLabel}</text>
      {mode === 'star' && remaining !== undefined && (
        <text x={40} y={48} textAnchor="middle" fontSize={8} fill={stroke}>{remaining.toFixed(1)}s</text>
      )}
      {label && (
        <text x={40} y={56} textAnchor="middle" fontSize={9} fill="#cbd5e1">{label}</text>
      )}
    </g>
  )
}
