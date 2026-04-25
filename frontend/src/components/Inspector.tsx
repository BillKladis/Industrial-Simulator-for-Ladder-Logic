import React, { useEffect, useState } from 'react'
import { useSelectionStore } from '../store/selectionStore'
import { useCircuitStore } from '../store/circuitStore'
import { useSimStore } from '../store/simStore'
import type { CircuitElement, ElementType } from '../types/circuit'

interface Props {
  send: (msg: Record<string, unknown>) => void
}

// Which element types are valid targets for each reference param key
const REFERENCE_TARGETS: Record<string, ElementType[]> = {
  coil_id:        ['relay_coil', 'air_valve', 'linear_piston'],
  retract_coil_id:['relay_coil', 'air_valve', 'linear_piston'],
  overload_id:    ['thermal_overload'],
  timer_id:       ['on_delay_timer', 'off_delay_timer'],
  lever_id:       ['npos_lever'],
}

export function Inspector({ send }: Props) {
  const { selectedId, selectedType, deselect } = useSelectionStore()
  const elements = useCircuitStore((s) => s.elements)
  const wires = useCircuitStore((s) => s.wires)
  const { updateParams, deleteElement, deleteWire, rotateElement } = useCircuitStore()
  const elementStates = useSimStore((s) => s.elementStates)

  const el = selectedId && selectedType === 'element' ? elements[selectedId] : null
  const wire = selectedId && selectedType === 'wire' ? wires[selectedId] : null

  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    if (el) {
      const strParams: Record<string, string> = {}
      for (const [k, v] of Object.entries(el.params)) {
        strParams[k] = String(v)
      }
      setParams(strParams)
    }
  }, [el?.id])

  if (!selectedId) {
    return (
      <div className="w-52 shrink-0 bg-slate-800 border-l border-slate-700 p-3 text-slate-500 text-xs">
        Select an element to inspect.
      </div>
    )
  }

  if (wire) {
    return (
      <div className="w-52 shrink-0 bg-slate-800 border-l border-slate-700 p-3 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400">Wire</div>
        <div className="text-xs text-slate-500">Node: {wire.node}</div>
        <button
          onClick={() => { deleteWire(wire.id); send({ type: 'delete_wire', wireId: wire.id }); deselect() }}
          className="mt-2 px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded"
        >
          Delete wire
        </button>
      </div>
    )
  }

  if (!el) return null

  const state = elementStates.get(el.id)

  const handleParamChange = (key: string, value: string) => {
    setParams((p) => ({ ...p, [key]: value }))
  }

  const applyParams = (overrides?: Record<string, string>) => {
    const source = overrides ?? params
    const parsed: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(source)) {
      const num = Number(v)
      // Keep strings that are IDs (reference params) or empty
      parsed[k] = v === '' || isNaN(num) ? v : num
    }
    updateParams(el.id, parsed)
    send({ type: 'update_params', elementId: el.id, params: parsed })
  }

  return (
    <div className="w-52 shrink-0 bg-slate-800 border-l border-slate-700 p-3 flex flex-col gap-2 overflow-y-auto">
      <div className="text-xs font-bold text-slate-300">{el.type}</div>
      <div className="text-xs text-slate-500 font-mono select-all" title="Element ID">{el.id}</div>

      {/* rotation */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400">Rotation: {el.rotation ?? 0}°</span>
        <div className="flex gap-1">
          <button
            onClick={() => rotateElement(el.id, -90)}
            className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded"
            title="Rotate CCW (Shift+R)"
          >↺ CCW</button>
          <button
            onClick={() => rotateElement(el.id, 90)}
            className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded"
            title="Rotate CW (R)"
          >↻ CW</button>
        </div>
      </div>

      {/* params */}
      <div className="flex flex-col gap-1.5 mt-1">
        {Object.keys(params).map((key) => {
          const refTypes = REFERENCE_TARGETS[key]
          if (refTypes) {
            const candidates = (Object.values(elements) as CircuitElement[]).filter(
              (e) => refTypes.includes(e.type)
            )
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-400">{key}</label>
                <select
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200"
                  value={params[key]}
                  onChange={(e) => {
                    const next = { ...params, [key]: e.target.value }
                    setParams(next)
                    applyParams(next)
                  }}
                >
                  <option value="">— none —</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {String(c.params.label || c.id)}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">{key}</label>
              <input
                className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200"
                value={params[key]}
                onChange={(e) => handleParamChange(key, e.target.value)}
                onBlur={() => applyParams()}
                onKeyDown={(e) => e.key === 'Enter' && applyParams()}
              />
            </div>
          )
        })}
      </div>

      {/* live state */}
      {state && (
        <div className="mt-2 border-t border-slate-700 pt-2">
          <div className="text-xs font-semibold text-slate-400 mb-1">Live state</div>
          {Object.entries(state).map(([k, v]) => (
            <div key={k} className="text-xs text-slate-400 flex justify-between">
              <span>{k}</span>
              <span className={String(v) === 'true' ? 'text-green-400' : 'text-slate-300'}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { deleteElement(el.id); send({ type: 'delete_element', elementId: el.id }); deselect() }}
        className="mt-auto px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded"
      >
        Delete element
      </button>
    </div>
  )
}
