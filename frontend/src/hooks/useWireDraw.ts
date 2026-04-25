import { useState, useCallback } from 'react'
import { useCircuitStore } from '../store/circuitStore'
import type { PortRef, Wire } from '../types/circuit'

let _wid = 0
const wireId = () => `w_${(++_wid).toString(16).padStart(6, '0')}`

interface WireStart {
  portRef: PortRef
  nodeId: string
  svgX: number
  svgY: number
}

export function useWireDraw(send: (msg: Record<string, unknown>) => void) {
  const [drawing, setDrawing] = useState<WireStart | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const { addWire } = useCircuitStore()

  const startWire = useCallback((portRef: PortRef, nodeId: string, svgX: number, svgY: number) => {
    setDrawing({ portRef, nodeId, svgX, svgY })
  }, [])

  const updateCursor = useCallback((x: number, y: number) => {
    setCursorPos({ x, y })
  }, [])

  const finishWire = useCallback(
    (toPortRef: PortRef, toNodeId: string, toSvgX: number, toSvgY: number) => {
      if (!drawing) return
      if (
        drawing.portRef.elementId === toPortRef.elementId &&
        drawing.portRef.port === toPortRef.port
      ) {
        setDrawing(null)
        setCursorPos(null)
        return
      }

      // Prefer the power-rail node if either endpoint is on a rail.
      // If we drew FROM a regular element TO a rail, drawing.nodeId is a
      // random uid but toNodeId is '__R__'/'__N__' — use the rail's node.
      const sharedNode =
        (toNodeId === '__R__' || toNodeId === '__N__') ? toNodeId : drawing.nodeId

      const wire: Wire = {
        id: wireId(),
        from: drawing.portRef,
        to: toPortRef,
        node: sharedNode,
        polyline: routeOrthogonal(
          drawing.svgX, drawing.svgY,
          toSvgX, toSvgY
        ),
      }

      addWire(wire)
      send({ type: 'connect_wire', wire })
      setDrawing(null)
      setCursorPos(null)
    },
    [drawing, addWire, send]
  )

  const cancelWire = useCallback(() => {
    setDrawing(null)
    setCursorPos(null)
  }, [])

  return { drawing, cursorPos, startWire, updateCursor, finishWire, cancelWire }
}

function routeOrthogonal(
  x1: number, y1: number,
  x2: number, y2: number
): [number, number][] {
  const mx = (x1 + x2) / 2
  return [[x1, y1], [mx, y1], [mx, y2], [x2, y2]]
}
