import { ReactNode, CSSProperties, useEffect, useState, useRef } from 'react'
import './AppNode.scss'
import { Point } from '@/data/Point'

export default function AppNode({
  name,
  inputParams,
  outputParams,
  style,
  onMove,
}: {
  name: string,
  inputParams?: ReactNode,
  outputParams?: ReactNode,
  style?: CSSProperties,
  onMove?: (p: Point) => void
}) {

  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<Point>({x: 0, y: 0})
  const [dragging, setDragging] = useState(false)
  const startDrag: React.MouseEventHandler = (e) => {
    setOffset({
      x: (ref.current?.offsetLeft ?? 0) - e.clientX,
      y: (ref.current?.offsetTop ?? 0) - e.clientY,
    })
    setDragging(true)
  }
  const stopDrag = () => setDragging(false)
  const drag = (e: MouseEvent) => {
    onMove &&
    onMove({
      x: e.clientX + offset.x,
      y: e.clientY + offset.y,
    }) 
  }
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', drag)
      window.addEventListener('mouseup', stopDrag)
    }
    else {
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('mouseup', stopDrag)
    }

    return () => {
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [dragging])

  return (
    <div ref={ref} className="app-node" style={style} onMouseDownCapture={startDrag}>
      <div className="app-node__name">{name}</div>
      <div className="app-node__params app-node__params--input">{inputParams}</div>
      <div className="app-node__params app-node__params--output">{outputParams}</div>
    </div>
  )
}