import { Param } from "@/data/Param"
import { useState } from "react"

export function useConnectionEvents(onToggleConnection: (src: Param, dst: Param) => void) {
  const [connectionStart, setConnectionStart] = useState<Param | null>(null)
  const connectionStarted = () => connectionStart != null
  const startConnection = (param: Param) => {
    setConnectionStart(param)
  }
  
  const endConnection = (param: Param) => {
    if (connectionStart == null) throw 'Connection not started'
    onToggleConnection(connectionStart, param)
    setConnectionStart(null)
  }
  
  const cancelConnection = () => {
    setConnectionStart(null)
  }

  return {
    connectionStart,
    connectionStarted,
    startConnection,
    endConnection,
    cancelConnection
  }
}

