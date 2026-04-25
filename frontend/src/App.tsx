import React from 'react'
import { Layout } from './components/Layout'
import { useSimSocket } from './hooks/useSimSocket'

const SESSION_ID = 'default'

export default function App() {
  const { send } = useSimSocket(SESSION_ID)
  return <Layout send={send} />
}
