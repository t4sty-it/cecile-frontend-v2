import { AppSelect } from '../AppSelect/AppSelect'
import './ConsoleInput.scss'
import { FormEventHandler, KeyboardEventHandler, forwardRef, useEffect, useRef, useState } from "react"

interface ConsoleInputProps {
  hints?: string[],
  onInput?: (input: string) => void,
  onCommand?: (cmd: string) => void,
}


const ConsoleInput = forwardRef<HTMLInputElement, ConsoleInputProps>(function(
  {
    hints,
    onInput,
    onCommand,
  }: ConsoleInputProps,
  ref
) {

  const [command, setCommand] = useState<string>('')
  const [hintSelected, setHintSelected] = useState(-1)

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    onCommand && onCommand(command)
    setCommand('')
  }

  const onKeyDown: KeyboardEventHandler = e => {
    e.stopPropagation()
    if (hints) {
      if (['ArrowUp', 'ArrowDown', 'Tab'].includes(e.code))
        e.preventDefault()

      switch(e.code){
        case 'ArrowUp': setHintSelected(h => (h+1) % hints.length); break
        case 'ArrowDown': setHintSelected(h => (h - 1 + hints.length) % hints!.length); break
        case 'Tab': setCommand(hints[hintSelected]); break
      }
    }
  }

  useEffect(() => {
    onInput && onInput(command)
  }, [command])

  useEffect(() => {
    setHintSelected(0)
  }, [hints])

  return (
    <form
      autoComplete='off'
      onSubmit={onSubmit}
      className="console-input"
    >
      <input
        ref={ref}
        name="command"
        value={command}
        onInput={e => setCommand((e.target as any).value)}
        onKeyDown={onKeyDown}
      />

      {hints &&
        <div className="console-input__hints">
          <AppSelect
            options={hints}
            selected={hintSelected}
          />
        </div>
      }
    </form>
  )
})

export default ConsoleInput