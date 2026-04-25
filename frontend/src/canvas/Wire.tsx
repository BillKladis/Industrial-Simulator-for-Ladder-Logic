import React from 'react'
import { polylinePoints } from './Routing'
import type { Wire as WireData } from '../types/circuit'

interface Props {
  wire: WireData
  live: boolean
  selected: boolean
  onClick: () => void
  onDelete: () => void
}

export function Wire({ wire, live, selected, onClick, onDelete }: Props) {
  const color = live ? '#22c55e' : '#475569'
  const pts = polylinePoints(wire.polyline)

  return (
    <g onClick={onClick}>
      {/* fat invisible hit target */}
      <polyline points={pts} stroke="transparent" strokeWidth={12} fill="none" style={{ cursor: 'pointer' }} />
      <polyline
        points={pts}
        stroke={selected ? '#60a5fa' : color}
        strokeWidth={selected ? 3 : 2}
        fill="none"
        strokeLinejoin="round"
        opacity={live ? 1 : 0.6}
      />
      {live && (
        <polyline
          points={pts}
          stroke="#4ade80"
          strokeWidth={1}
          fill="none"
          opacity={0.5}
          strokeDasharray="6 4"
        />
      )}
    </g>
  )
}
