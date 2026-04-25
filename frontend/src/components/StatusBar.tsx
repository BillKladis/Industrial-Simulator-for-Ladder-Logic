import React from 'react'
import { useSimStore } from '../store/simStore'
import { useCircuitStore } from '../store/circuitStore'

export function StatusBar() {
  const { running, connected, tickRate, tickTime } = useSimStore()
  const elements = useCircuitStore((s) => s.elements)
  const wires = useCircuitStore((s) => s.wires)

  return (
    <div className="flex items-center gap-4 px-4 py-1 bg-slate-900 border-t border-slate-700 text-xs text-slate-500 shrink-0">
      <span>
        {running ? (
          <span className="text-green-400">● Running</span>
        ) : (
          <span className="text-slate-500">○ Stopped</span>
        )}
      </span>
      <span>{Object.keys(elements).length} elements</span>
      <span>{Object.keys(wires).length} wires</span>
      {running && (
        <>
          <span>t={tickTime.toFixed(2)}s</span>
          <span>{tickRate} Hz</span>
        </>
      )}
      <div className="flex-1" />
      <span>{connected ? 'WS: connected' : 'WS: disconnected'}</span>
      <span className="text-slate-600">Drag from palette · Click port to wire · Alt+drag to pan · Scroll to zoom</span>
    </div>
  )
}
