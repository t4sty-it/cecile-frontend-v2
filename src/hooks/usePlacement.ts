import { Point } from "@/data/Point"
import { useEffect, useState } from "react"

// While `nodeId` is set, the node follows the mouse until the next click
// (which drops it in place) or Escape (which cancels).
export function usePlacement(
  onMove: (id: string, point: Point) => void,
  onCancel: (id: string) => void,
) {
  const [nodeId, setNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (nodeId === null) return

    const onMouseMove = (e: MouseEvent) => onMove(nodeId, {x: e.clientX, y: e.clientY})
    // Capture + stop, so the dropping click doesn't also start a drag/selection
    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation()
      setNodeId(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onCancel(nodeId)
      setNodeId(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [nodeId, onMove, onCancel])

  return { placing: nodeId !== null, start: setNodeId }
}
