import React from 'react'
import { SymbolPalette } from './SymbolPalette'
import { Inspector } from './Inspector'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import { Canvas } from '../canvas/Canvas'

interface Props {
  send: (msg: Record<string, unknown>) => void
}

export function Layout({ send }: Props) {
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200">
      <Toolbar send={send} />
      <div className="flex flex-1 min-h-0">
        <SymbolPalette />
        <div className="flex-1 min-w-0">
          <Canvas send={send} />
        </div>
        <Inspector send={send} />
      </div>
      <StatusBar />
    </div>
  )
}
