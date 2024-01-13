import { cssClasses } from '@/utils/cssClasses'
import './AppParam.scss'
import { EventHandler, FormEventHandler, MouseEventHandler, SyntheticEvent } from "react"

export default function AppParam({
  name,
  value,
  type,
  showInput = false,
  connectable = true,
  options,
  onMouseUp,
  onMouseDown,
  onChange,
}: {
  name?: string,
  value?: string,
  showInput?: boolean,
  connectable?: boolean,
  options?: {label: string, value: string|number}[]
  onMouseUp?: MouseEventHandler,
  onMouseDown?: MouseEventHandler,
  onChange?: (value: string) => void,
  type?: 'input' | 'output'
}) {

  const className = cssClasses([
    'app-param',
    `app-param--${type}`
  ])

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

  const onInputChange: FormEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange && onChange(((
      e.target as HTMLFormElement)
        .elements.namedItem('input') as HTMLInputElement)
          .value)
  }

  const onSelectChange: FormEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange && onChange((e.target as HTMLSelectElement).value)
  }

  const noop: EventHandler<SyntheticEvent> = e => {
    e.stopPropagation()
  } 

  return ( 
    <div className={className}>

      {connectable &&
        <div className="app-param__connector"
          onMouseDownCapture={mouseDown}
          onMouseUpCapture={mouseUp}
        >
          <div className="app-param__connector-target"></div>
        </div>

      }
      
      <div className="app-param__name">{name}</div>
      
      {showInput &&
        <div className="app-param__input">
          {options
            ? (
              <select value={value} onChange={onSelectChange} onMouseDown={noop}>
                {options.map(option =>
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )}
              </select>
            )
            : (
              <form onSubmit={onInputChange}>
                <input defaultValue={value} name='input'/>
              </form>
            )
          }
        </div>
      }
    </div>
  )
}