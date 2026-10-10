import { cssClasses } from '@/utils/cssClasses'
import './AppParam.scss'
import { EventHandler, FormEventHandler, MouseEventHandler, SyntheticEvent } from "react"

export default function AppParam({
  name,
  value,
  type,
  dataType,
  showInput = false,
  connectable = true,
  options,
  onMouseUp,
  onMouseDown,
  onChange,
}: {
  name?: string,
  value?: string,
  dataType?: 'number' | 'string' | 'signal' | 'file',
  showInput?: boolean,
  connectable?: boolean,
  options?: {label: string, value: string|number}[]
  onMouseUp?: MouseEventHandler,
  onMouseDown?: MouseEventHandler,
  onChange?: (value: string | File) => void,
  type?: 'input' | 'output'
}) {

  const className = cssClasses(
    'app-param',
    `app-param--${type}`
  )

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

  const onFileChange: FormEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) onChange && onChange(file)
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
          {dataType == 'file'
            ? <input type='file' accept='audio/*' onChange={onFileChange} onMouseDown={noop}/>
            : options
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