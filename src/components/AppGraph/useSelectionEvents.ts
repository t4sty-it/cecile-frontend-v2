import { useSelectionStore } from "@/contexts/SelectionContext"
import { Node } from "@/data/Node"
import { Point } from "@/data/Point"
import { useState } from "react"

export const useSelectionEvents = (nodes: Node[]) => {

  const [selectionStart, setSelectionStart] = useState<Point | null>(null)
  const selectionStarted= selectionStart != null
  const beginSelection = (p: Point) => setSelectionStart(p) 
  const endSelection = () => {
    setSelectionStart(null)
  }

  const {set, add} = useSelectionStore()
  const updateSelection = (p1: Point, p2: Point, {additive}: {additive: boolean}) => {

    const min: Point = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)}
    const max: Point = {x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y)}

    const hit = nodes.filter(n => 
      n.position.x >= min.x && n.position.y >= min.y
      && n.position.x <= max.x && n.position.y <= max.y
    ).map(h => h.id)

    if (additive) {
      add(...hit)
    }
    else {
      set(hit)
    }
  }

  return {
    updateSelection,
    selectionStarted,
    selectionStart,
    beginSelection,
    endSelection
  }
}