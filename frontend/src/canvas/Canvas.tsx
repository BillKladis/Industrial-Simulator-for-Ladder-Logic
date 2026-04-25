import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import { useSelectionStore } from '../store/selectionStore'
import { useWireDraw } from '../hooks/useWireDraw'
import { useDragDrop } from '../hooks/useDragDrop'
import { ElementNode } from './ElementNode'
import { Wire } from './Wire'
import { routeManhattan } from './Routing'
import type { PortRef } from '../types/circuit'

const GRID_SIZE = 20

interface Props {
  send: (msg: Record<string, unknown>) => void
}

interface ViewBox {
  x: number
  y: number
  scale: number
}

export function Canvas({ send }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ clientX: number; clientY: number; vbX: number; vbY: number } | null>(null)

  const { elements, wires, deleteWire } = useCircuitStore()
  const liveNodes = useSimStore((s) => s.liveNodes)
  const { selectedId, selectedType, select, deselect } = useSelectionStore()

  const { drawing, cursorPos, startWire, updateCursor, finishWire, cancelWire } = useWireDraw(send)
  const { onDrop, onDragOver } = useDragDrop(send)

  // Pan
  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { clientX: e.clientX, clientY: e.clientY, vbX: viewBox.x, vbY: viewBox.y }
    } else {
      deselect()
      cancelWire()
    }
  }, [viewBox, deselect, cancelWire])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning && panStart.current) {
      const dx = (e.clientX - panStart.current.clientX) / viewBox.scale
      const dy = (e.clientY - panStart.current.clientY) / viewBox.scale
      setViewBox((v) => ({ ...v, x: panStart.current!.vbX - dx, y: panStart.current!.vbY - dy }))
    }
    if (drawing && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / viewBox.scale + viewBox.x
      const y = (e.clientY - rect.top) / viewBox.scale + viewBox.y
      updateCursor(x, y)
    }
  }, [isPanning, drawing, viewBox, updateCursor])

  const onMouseUp = useCallback(() => {
    setIsPanning(false)
    panStart.current = null
  }, [])

  // Zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setViewBox((v) => ({ ...v, scale: Math.max(0.2, Math.min(5, v.scale * factor)) }))
  }, [])

  const onPortClick = useCallback(
    (portRef: PortRef, nodeId: string, svgX: number, svgY: number) => {
      if (!drawing) {
        startWire(portRef, nodeId, svgX, svgY)
      } else {
        finishWire(portRef, nodeId, svgX, svgY)
      }
    },
    [drawing, startWire, finishWire]
  )

  const onPortHover = useCallback((x: number, y: number) => {
    if (drawing) updateCursor(x, y)
  }, [drawing, updateCursor])

  // SVG viewBox string
  const svgEl = svgRef.current
  const svgW = svgEl?.clientWidth ?? 1200
  const svgH = svgEl?.clientHeight ?? 800
  const vbStr = `${viewBox.x} ${viewBox.y} ${svgW / viewBox.scale} ${svgH / viewBox.scale}`

  // Grid lines
  const gridLines = () => {
    const lines: React.ReactNode[] = []
    const left = Math.floor(viewBox.x / GRID_SIZE) * GRID_SIZE
    const top = Math.floor(viewBox.y / GRID_SIZE) * GRID_SIZE
    const right = viewBox.x + svgW / viewBox.scale
    const bottom = viewBox.y + svgH / viewBox.scale
    for (let x = left; x <= right; x += GRID_SIZE) {
      lines.push(<line key={`v${x}`} x1={x} y1={top} x2={x} y2={bottom} stroke="#1e293b" strokeWidth={0.5} />)
    }
    for (let y = top; y <= bottom; y += GRID_SIZE) {
      lines.push(<line key={`h${y}`} x1={left} y1={y} x2={right} y2={y} stroke="#1e293b" strokeWidth={0.5} />)
    }
    return lines
  }

  return (
    <svg
      ref={svgRef}
      viewBox={vbStr}
      className="w-full h-full bg-slate-900 select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onDrop={(e) => onDrop(e, svgRef.current, viewBox)}
      onDragOver={onDragOver}
      style={{ cursor: isPanning ? 'grabbing' : drawing ? 'crosshair' : 'default' }}
    >
      {/* grid */}
      <g>{gridLines()}</g>

      {/* wires */}
      {Object.values(wires).map((w) => {
        const live = liveNodes.has(w.node)
        return (
          <Wire
            key={w.id}
            wire={w}
            live={live}
            selected={selectedId === w.id && selectedType === 'wire'}
            onClick={() => select(w.id, 'wire')}
            onDelete={() => {
              deleteWire(w.id)
              send({ type: 'delete_wire', wireId: w.id })
            }}
          />
        )
      })}

      {/* elements */}
      {Object.values(elements).map((el) => (
        <ElementNode
          key={el.id}
          element={el}
          selected={selectedId === el.id && selectedType === 'element'}
          isDrawingWire={!!drawing}
          onSelect={() => select(el.id, 'element')}
          onPortClick={onPortClick}
          onPortHover={onPortHover}
          send={send}
        />
      ))}

      {/* wire being drawn */}
      {drawing && cursorPos && (
        <polyline
          points={routeManhattan(drawing.svgX, drawing.svgY, cursorPos.x, cursorPos.y)}
          stroke="#60a5fa"
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 3"
        />
      )}
    </svg>
  )
}
