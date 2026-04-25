import React, { useRef, useState, useCallback } from 'react'
import type { CircuitElement, ElementTickState, PortRef } from '../types/circuit'
import { GRID, SYMBOL_W, SYMBOL_H } from '../types/circuit'
import { SYMBOL_MAP, PORT_OFFSETS } from './symbols/index'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import { snapToGrid } from './Snap'
import { PORT_RADIUS } from './Snap'

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
  const { moveElement, deleteElement } = useCircuitStore()
  const elementStates = useSimStore((s) => s.elementStates)
  const running = useSimStore((s) => s.running)
  const state: ElementTickState = elementStates.get(element.id) ?? {}

  const SymbolComp = SYMBOL_MAP[element.type]
  const ports = PORT_OFFSETS[element.type] ?? { a: { x: 0, y: 20 }, b: { x: 60, y: 20 } }

  // Drag state
  const dragRef = useRef<{ startClientX: number; startClientY: number; origX: number; origY: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (isDrawingWire) return
    e.stopPropagation()
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
      const newX = snapToGrid(dragRef.current.origX + dx)
      const newY = snapToGrid(dragRef.current.origY + dy)
      moveElement(element.id, newX, newY)
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
  }, [element.id, deleteElement, send])

  // Button click during simulation
  const onClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (running && (element.type === 'push_button_no' || element.type === 'push_button_nc')) {
      // handled by mousedown/up for momentary
    }
    if (!running) onSelect()
  }, [running, element.type, onSelect])

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
  }, [running, element.type, element.id, send])

  const portAx = element.x + ports.a.x
  const portAy = element.y + ports.a.y
  const portBx = element.x + ports.b.x
  const portBy = element.y + ports.b.y

  return (
    <g
      tabIndex={0}
      onMouseDown={running ? onSimMouseDown : onMouseDown}
      onKeyDown={onKeyDown}
      style={{ cursor: running ? 'pointer' : 'grab', outline: 'none' }}
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

      {/* port handles */}
      {[
        { portKey: 'a' as const, x: portAx, y: portAy, node: element.ports.a },
        { portKey: 'b' as const, x: portBx, y: portBy, node: element.ports.b },
      ].map(({ portKey, x, y, node }) => (
        <circle
          key={portKey}
          cx={x} cy={y} r={PORT_RADIUS}
          fill="transparent"
          stroke={isDrawingWire ? '#60a5fa' : 'transparent'}
          strokeWidth={1.5}
          style={{ cursor: 'crosshair' }}
          onMouseEnter={() => onPortHover(x, y)}
          onClick={(e) => {
            e.stopPropagation()
            onPortClick({ elementId: element.id, port: portKey }, node, x, y)
          }}
        />
      ))}
    </g>
  )
}
