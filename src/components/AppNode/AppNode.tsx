import { useSelectionStore } from '@/contexts/SelectionContext'
import { Point } from '@/data/Point'
import { cssClasses } from '@/utils/cssClasses'
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'
import './AppNode.scss'

export default function AppNode({
  id,
  name,
  label,
  inputParams,
  outputParams,
  style,
  onMove,
  onDelete,
}: {
  id: string,
  name: string,
  label?: string,
  inputParams?: ReactNode,
  outputParams?: ReactNode,
  style?: CSSProperties,
  onMove?: (delta: Point) => void,
  onDelete?: () => void,
}) {

  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<Point>({x: 0, y: 0})
  const prev = useRef<Point>({x: 0, y: 0})
  const [dragging, setDragging] = useState(false)
  const startDrag: React.MouseEventHandler = (e) => {
    const o: Point = {
      x: (ref.current?.offsetLeft ?? 0) - e.clientX,
      y: (ref.current?.offsetTop ?? 0) - e.clientY,
    }
    setOffset(o)
    prev.current = {
      x: e.clientX + o.x,
      y: e.clientY + o.y,
    }
    setDragging(true)
  }
  const stopDrag = () => setDragging(false)
  const drag = (e: MouseEvent) => {
    const cur: Point = {
      x: e.clientX + offset.x,
      y: e.clientY + offset.y,
    } 
    const delta: Point = {
      x: cur.x - prev.current.x,
      y: cur.y - prev.current.y
    }
    
    onMove &&
    onMove(delta)
    prev.current = {...cur}
    
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


  const {nodes} = useSelectionStore()
  const isSelected = nodes.includes(id)
  const cx = cssClasses('app-node', isSelected && 'app-node--selected')

  return (
    <div ref={ref} className={cx} style={style} onMouseDown={startDrag}>
      <div className="app-node__header">
        <div className="app-node__name">{name}</div>
        {label &&
          <>
            <div className="app-node__separator">:</div>
            <div className="app-node__label">{label}</div>
          </>
        }
        <div className="app-node__actions">
          <button className='app-node-action icon-button' onClick={onDelete}>🗑</button>
        </div>
      </div>
      <div className="app-node__params app-node__params--input">{inputParams}</div>
      <div className="app-node__params app-node__params--output">{outputParams}</div>
    </div>
  )
}