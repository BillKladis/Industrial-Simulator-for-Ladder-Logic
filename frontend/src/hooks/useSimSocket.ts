import { useEffect, useRef, useCallback } from 'react'
import { SimSocket, type SocketMessage } from '../api/socket'
import { useSimStore } from '../store/simStore'
import type { TickMessage, ElementTickState } from '../types/circuit'

export function useSimSocket(sessionId: string) {
  const socketRef = useRef<SimSocket | null>(null)
  const { setConnected, setRunning, applyTick } = useSimStore()

  useEffect(() => {
    const sock = new SimSocket(sessionId)
    socketRef.current = sock

    const unsub = sock.on((msg: SocketMessage) => {
      const type = msg.type as string
      if (type === 'connected') setConnected(true)
      if (type === 'disconnected') setConnected(false)
      if (type === 'sim_started') setRunning(true)
      if (type === 'sim_stopped') setRunning(false)
      if (type === 'tick') {
        const tick = msg as unknown as TickMessage
        applyTick(tick.t, tick.liveNodes, tick.elements as Record<string, ElementTickState>)
      }
    })

    sock.connect()

    return () => {
      unsub()
      sock.close()
    }
  }, [sessionId, setConnected, setRunning, applyTick])

  const send = useCallback((msg: SocketMessage) => {
    socketRef.current?.send(msg)
  }, [])

  return { send }
}
