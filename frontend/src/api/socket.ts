export type SocketMessage = Record<string, unknown>
export type MessageHandler = (msg: SocketMessage) => void

const WS_BASE = `ws://${window.location.hostname}:8000`

export class SimSocket {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private sessionId: string
  private reconnectDelay = 1000
  private _closed = false

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  connect(): void {
    if (this.ws) return
    const url = `${WS_BASE}/ws/sim/${this.sessionId}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      this._emit({ type: 'connected' })
    }

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as SocketMessage
        this._emit(msg)
      } catch {
        // ignore bad JSON
      }
    }

    this.ws.onclose = () => {
      this.ws = null
      this._emit({ type: 'disconnected' })
      if (!this._closed) {
        setTimeout(() => this.connect(), this.reconnectDelay)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 16000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  send(msg: SocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  on(handler: MessageHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  close(): void {
    this._closed = true
    this.ws?.close()
    this.ws = null
  }

  private _emit(msg: SocketMessage): void {
    for (const h of this.handlers) h(msg)
  }
}
