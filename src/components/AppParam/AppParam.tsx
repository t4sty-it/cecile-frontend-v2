import { MouseEventHandler } from "react"

export default function AppParam({
  name,
  onMouseUp,
  onMouseDown,
}: {
  name?: string,
  onMouseUp?: MouseEventHandler,
  onMouseDown?: MouseEventHandler
}) {

  const mouseDown: MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    onMouseDown && onMouseDown(e)
  }

  const mouseUp: MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    onMouseUp && onMouseUp(e)
  }

  return ( 
    <div
      className="app-param"
      onMouseDown={mouseDown}
      onMouseUp={mouseUp}
    >
      <div className="app-param__name">{name}</div>
    </div>
  )
}