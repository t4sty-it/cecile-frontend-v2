import { AppSelect } from '../AppSelect/AppSelect'
import './ConsoleInput.scss'
import { FormEventHandler, KeyboardEventHandler, useEffect, useRef, useState } from "react"

export default function ConsoleInput({
  hints,
  onInput,
  onCommand,
}: {
  hints?: string[],
  onInput?: (input: string) => void,
  onCommand?: (cmd: string) => void,
}) {

  const [command, setCommand] = useState<string>('')
  const [hintSelected, setHintSelected] = useState(-1)

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    onCommand && onCommand(command)
    setCommand('')
  }

  const onKeyDown: KeyboardEventHandler = e => {
    if (hints) {
      if (['ArrowUp', 'ArrowDown', 'ArrowRight'].includes(e.code))
        e.preventDefault()

      switch(e.code){
        case 'ArrowUp': setHintSelected(h => (h+1) % hints.length); break
        case 'ArrowDown': setHintSelected(h => (h - 1 + hints.length) % hints!.length); break
        case 'ArrowRight': setCommand(hints[hintSelected]); break
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
}