import { Point } from "@/data/Point";
import { useEffect, useState } from "react";

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