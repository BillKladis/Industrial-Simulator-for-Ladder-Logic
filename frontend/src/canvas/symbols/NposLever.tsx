import React from 'react'

interface Props {
  energized: boolean
  label?: string
  positions?: number
  position?: number
}

export function NposLever({ label = '', positions = 3, position = 0 }: Props) {
  const stroke = '#94a3b8'
  const activeColor = '#f59e0b'
  const cx = 30
  const cy = 20
  const r = 14

  // Draw tick marks around the dial for each position
  const ticks = Array.from({ length: positions }, (_, i) => {
    const startAngle = -150
    const sweep = 300
    const angle = startAngle + (sweep / Math.max(1, positions - 1)) * i
    const rad = (angle * Math.PI) / 180
    const x1 = cx + (r - 3) * Math.cos(rad)
    const y1 = cy + (r - 3) * Math.sin(rad)
    const x2 = cx + (r + 2) * Math.cos(rad)
    const y2 = cy + (r + 2) * Math.sin(rad)
    const isActive = i === position
    return { x1, y1, x2, y2, isActive, angle, rad }
  })

  const activeTick = ticks[position]
  const needleX = activeTick ? cx + (r - 6) * Math.cos(activeTick.rad) : cx
  const needleY = activeTick ? cy + (r - 6) * Math.sin(activeTick.rad) : cy

  return (
    <g>
      <line x1={0} y1={20} x2={8} y2={20} stroke={stroke} strokeWidth={2} />
      <line x1={52} y1={20} x2={60} y2={20} stroke={stroke} strokeWidth={2} />
      {/* dial body */}
      <circle cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={2} fill="#1e293b" />
      {/* tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isActive ? activeColor : '#475569'}
          strokeWidth={t.isActive ? 2 : 1}
        />
      ))}
      {/* needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={activeColor} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2.5} fill={activeColor} />
      {/* position label inside */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill={activeColor} fontWeight="bold">
        {position}
      </text>
      {label && (
        <text x={30} y={38} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>
      )}
    </g>
  )
}
