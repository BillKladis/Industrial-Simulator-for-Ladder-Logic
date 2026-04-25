import type { CircuitElement } from '../types/circuit'
import { SYMBOL_W, SYMBOL_H } from '../types/circuit'
import { PORT_OFFSETS } from './symbols/index'

function rotatePoint(px: number, py: number, cx: number, cy: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

/** Absolute SVG-space position of a port, accounting for element rotation. */
export function getPortPos(el: CircuitElement, port: 'a' | 'b'): { x: number; y: number } {
  const portDefs = PORT_OFFSETS[el.type] ?? { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }
  const raw = { x: el.x + portDefs[port].x, y: el.y + portDefs[port].y }
  const rot = el.rotation ?? 0
  if (!rot) return raw
  const cx = el.x + SYMBOL_W / 2
  const cy = el.y + SYMBOL_H / 2
  return rotatePoint(raw.x, raw.y, cx, cy, rot)
}
