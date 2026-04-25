import { useCallback } from 'react'
import { useCircuitStore } from '../store/circuitStore'
import { GRID } from '../types/circuit'
import type { ElementType } from '../types/circuit'

export const DRAG_TYPE_KEY = 'application/x-ladder-element-type'

export function useDragDrop(send: (msg: Record<string, unknown>) => void) {
  const { placeElement } = useCircuitStore()

  const onDragStart = useCallback(
    (e: React.DragEvent, type: ElementType) => {
      e.dataTransfer.setData(DRAG_TYPE_KEY, type)
      e.dataTransfer.effectAllowed = 'copy'
    },
    []
  )

  const onDrop = useCallback(
    (e: React.DragEvent, svgRef: SVGSVGElement | null, viewBox: { x: number; y: number; scale: number }) => {
      e.preventDefault()
      const type = e.dataTransfer.getData(DRAG_TYPE_KEY) as ElementType
      if (!type || !svgRef) return

      const rect = svgRef.getBoundingClientRect()
      const rawX = (e.clientX - rect.left) / viewBox.scale + viewBox.x
      const rawY = (e.clientY - rect.top) / viewBox.scale + viewBox.y
      const x = Math.round(rawX / GRID) * GRID
      const y = Math.round(rawY / GRID) * GRID

      const el = placeElement(type, x, y)
      send({ type: 'place_element', element: el })
    },
    [placeElement, send]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  return { onDragStart, onDrop, onDragOver }
}
