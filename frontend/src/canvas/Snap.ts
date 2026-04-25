import { GRID } from '../types/circuit'

export const PORT_RADIUS = 8

export function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID
}

export function snapPoint(x: number, y: number): { x: number; y: number } {
  return { x: snapToGrid(x), y: snapToGrid(y) }
}

export function hitTestPort(
  px: number, py: number,
  targetX: number, targetY: number
): boolean {
  const dx = px - targetX
  const dy = py - targetY
  return dx * dx + dy * dy <= PORT_RADIUS * PORT_RADIUS
}

/** Convert SVG client coordinates to SVG user-space coordinates. */
export function clientToSvg(
  e: { clientX: number; clientY: number },
  svg: SVGSVGElement
): { x: number; y: number } {
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const m = svg.getScreenCTM()!.inverse()
  const tp = pt.matrixTransform(m)
  return { x: tp.x, y: tp.y }
}
