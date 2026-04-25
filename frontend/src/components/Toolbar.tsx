import React, { useState } from 'react'
import { useSimStore } from '../store/simStore'
import { useCircuitStore } from '../store/circuitStore'
import { http } from '../api/http'

interface Props {
  send: (msg: Record<string, unknown>) => void
}

export function Toolbar({ send }: Props) {
  const { running, connected } = useSimStore()
  const { getCircuitData, loadCircuit, clearCircuit, circuitName, setName } = useCircuitStore()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nameInput, setNameInput] = useState(circuitName)

  const handleRun = () => {
    const data = getCircuitData()
    send({ type: 'load_circuit', data })
    setTimeout(() => send({ type: 'start_sim' }), 50)
  }

  const handleStop = () => send({ type: 'stop_sim' })

  const handleSave = async () => {
    setSaving(true)
    try {
      await http.createCircuit(nameInput || 'Untitled', getCircuitData())
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async () => {
    setLoading(true)
    try {
      const list = await http.listCircuits()
      if (list.length === 0) { alert('No saved circuits.'); return }
      const choice = list[0] // auto-load latest for now
      const full = await http.getCircuit(choice.id)
      loadCircuit(full.data, full.name)
      setNameInput(full.name)
      send({ type: 'load_circuit', data: full.data })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    clearCircuit()
    send({ type: 'stop_sim' })
  }

  const dot = connected ? 'bg-green-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 border-b border-slate-700">
      {/* connection indicator */}
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} title={connected ? 'Connected' : 'Disconnected'} />

      {/* circuit name */}
      <input
        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 w-36"
        value={nameInput}
        onChange={(e) => { setNameInput(e.target.value); setName(e.target.value) }}
        placeholder="Circuit name"
      />

      <div className="flex-1" />

      {!running ? (
        <button
          onClick={handleRun}
          disabled={!connected}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm rounded font-semibold"
        >
          ▶ Run
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded font-semibold"
        >
          ■ Stop
        </button>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded"
      >
        {saving ? '…' : 'Save'}
      </button>

      <button
        onClick={handleLoad}
        disabled={loading}
        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 text-white text-sm rounded"
      >
        {loading ? '…' : 'Load'}
      </button>

      <button
        onClick={handleClear}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded"
      >
        Clear
      </button>
    </div>
  )
}
