import React, { useRef, useCallback } from 'react'
import type { CircuitElement, ElementTickState, PortRef } from '../types/circuit'
import { GRID, SYMBOL_W, SYMBOL_H } from '../types/circuit'
import { SYMBOL_MAP, PORT_OFFSETS } from './symbols/index'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import { snapToGrid } from './Snap'
import { PORT_RADIUS } from './Snap'

function rotatePoint(px: number, py: number, cx: number, cy: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

interface Props {
  element: CircuitElement
  selected: boolean
  isDrawingWire: boolean
  onSelect: () => void
  onPortClick: (portRef: PortRef, nodeId: string, svgX: number, svgY: number) => void
  onPortHover: (svgX: number, svgY: number) => void
  send: (msg: Record<string, unknown>) => void
}

export function ElementNode({
  element, selected, isDrawingWire, onSelect, onPortClick, onPortHover, send
}: Props) {
  const { moveElement, deleteElement, rotateElement } = useCircuitStore()
  const elementStates = useSimStore((s) => s.elementStates)
  const running = useSimStore((s) => s.running)
  const state: ElementTickState = elementStates.get(element.id) ?? {}

  const SymbolComp = SYMBOL_MAP[element.type]
  const portDefs = PORT_OFFSETS[element.type] ?? { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

  const rotation = element.rotation ?? 0
  const cx = element.x + SYMBOL_W / 2
  const cy = element.y + SYMBOL_H / 2

  // Compute SVG-space port positions accounting for rotation
  const rawPortA = { x: element.x + portDefs.a.x, y: element.y + portDefs.a.y }
  const rawPortB = { x: element.x + portDefs.b.x, y: element.y + portDefs.b.y }
  const portA = rotatePoint(rawPortA.x, rawPortA.y, cx, cy, rotation)
  const portB = rotatePoint(rawPortB.x, rawPortB.y, cx, cy, rotation)

  // Drag state
  const dragRef = useRef<{ startClientX: number; startClientY: number; origX: number; origY: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation()
    if (isDrawingWire) return
    onSelect()

    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: element.x,
      origY: element.y,
    }

    const svg = (e.currentTarget.closest('svg') as SVGSVGElement)!
    const ctm = svg.getScreenCTM()!
    const scale = ctm.a

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = (ev.clientX - dragRef.current.startClientX) / scale
      const dy = (ev.clientY - dragRef.current.startClientY) / scale
      moveElement(element.id, snapToGrid(dragRef.current.origX + dx), snapToGrid(dragRef.current.origY + dy))
    }

    const onMouseUp = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = (ev.clientX - dragRef.current.startClientX) / scale
      const dy = (ev.clientY - dragRef.current.startClientY) / scale
      const newX = snapToGrid(dragRef.current.origX + dx)
      const newY = snapToGrid(dragRef.current.origY + dy)
      moveElement(element.id, newX, newY)
      send({ type: 'move_element', elementId: element.id, x: newX, y: newY })
      dragRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [element, moveElement, onSelect, isDrawingWire, send])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteElement(element.id)
      send({ type: 'delete_element', elementId: element.id })
    }
    if (e.key === 'r' || e.key === 'R') {
      rotateElement(element.id, e.shiftKey ? -90 : 90)
    }
  }, [element.id, deleteElement, rotateElement, send])

  const onSimMouseDown = useCallback((e: React.MouseEvent) => {
    if (!running) return
    const isPB = element.type === 'push_button_no' || element.type === 'push_button_nc'
    if (isPB) {
      e.stopPropagation()
      send({ type: 'button_event', elementId: element.id, pressed: true })
      const onUp = () => {
        send({ type: 'button_event', elementId: element.id, pressed: false })
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mouseup', onUp)
    }
    const isSwitch = element.type === 'hand_switch' || element.type === 'limit_switch_no' || element.type === 'limit_switch_nc'
    if (isSwitch) {
      e.stopPropagation()
      send({ type: 'button_event', elementId: element.id, pressed: true, toggle: true })
    }
    if (element.type === 'npos_lever') {
      e.stopPropagation()
      send({ type: 'button_event', elementId: element.id, pressed: true })
    }
  }, [running, element.type, element.id, send])

  return (
    <g
      tabIndex={0}
      onMouseDown={running ? onSimMouseDown : onMouseDown}
      onKeyDown={onKeyDown}
      style={{ cursor: running ? 'pointer' : 'grab', outline: 'none' }}
      transform={rotation ? `rotate(${rotation},${cx},${cy})` : undefined}
    >
      {/* selection outline */}
      {selected && (
        <rect
          x={element.x - 4} y={element.y - 4}
          width={SYMBOL_W + 8} height={SYMBOL_H + 8}
          rx={4}
          fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 2"
        />
      )}

      {/* symbol */}
      <g transform={`translate(${element.x},${element.y})`}>
        {SymbolComp ? (
          <SymbolComp element={element} state={state} />
        ) : (
          <rect width={SYMBOL_W} height={SYMBOL_H} fill="#1e293b" stroke="#475569" strokeWidth={2} rx={4} />
        )}
      </g>

      {/* port handles — positioned at unrotated coords; the group transform rotates them */}
      {[
        { portKey: 'a' as const, x: rawPortA.x, y: rawPortA.y, rpt: portA, node: element.ports.a },
        { portKey: 'b' as const, x: rawPortB.x, y: rawPortB.y, rpt: portB, node: element.ports.b },
      ].map(({ portKey, x, y, rpt, node }) => (
        <circle
          key={portKey}
          cx={x} cy={y} r={PORT_RADIUS}
          fill={isDrawingWire ? '#1e3a5f' : '#1e293b'}
          stroke={isDrawingWire ? '#60a5fa' : '#475569'}
          strokeWidth={isDrawingWire ? 2 : 1}
          style={{ cursor: 'crosshair' }}
          onMouseEnter={() => onPortHover(rpt.x, rpt.y)}
          onClick={(e) => {
            e.stopPropagation()
            onPortClick({ elementId: element.id, port: portKey }, node, rpt.x, rpt.y)
          }}
        />
      ))}
    </g>
  )
}
