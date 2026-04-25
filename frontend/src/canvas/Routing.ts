/** Manhattan (orthogonal) routing between two points.
 *  Returns an SVG polyline points string. */
export function routeManhattan(
  x1: number, y1: number,
  x2: number, y2: number
): string {
  const mid = (x1 + x2) / 2
  return `${x1},${y1} ${mid},${y1} ${mid},${y2} ${x2},${y2}`
}

export function polylinePoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ')
}
