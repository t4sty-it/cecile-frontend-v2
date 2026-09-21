import { Point } from "@/data/Point";
import { MutableRefObject, useEffect, useRef, useState } from "react";

export function useMousePosition(): Point {
  const [pos, setPos] = useState<Point>({x: 0, y: 0})

  function updatePos(e: MouseEvent) {
    setPos({x: e.clientX, y: e.clientY})
  }

  useEffect(() => {
    window.addEventListener('mousemove', updatePos)
    return () => {
      window.removeEventListener('mousemove', updatePos)
    }
  })

  return pos
}

// Unlike useMousePosition, this doesn't trigger a re-render on move: reads
// via .current always reflect the live position, even inside a callback
// whose closure was created long before it fires (e.g. an async MIDI
// message handler registered on a click and invoked much later).
export function useMousePositionRef(): MutableRefObject<Point> {
  const posRef = useRef<Point>({x: 0, y: 0})

  useEffect(() => {
    function updatePos(e: MouseEvent) {
      posRef.current = {x: e.clientX, y: e.clientY}
    }
    window.addEventListener('mousemove', updatePos)
    return () => {
      window.removeEventListener('mousemove', updatePos)
    }
  }, [])

  return posRef
}