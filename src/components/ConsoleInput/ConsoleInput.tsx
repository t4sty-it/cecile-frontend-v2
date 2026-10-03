import { AppSelect } from '../AppSelect/AppSelect'
import './ConsoleInput.scss'
import { FormEventHandler, KeyboardEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { cssClasses } from '@/utils/cssClasses'

export interface ConsoleInputHandle {
  focus: () => void,
  // replaces the current text, e.g. with a snippet from the docs
  load: (command: string) => void,
}

interface ConsoleInputProps {
  hints?: string[],
  error?: string | null,
  onInput?: (input: string) => void,
  onCommand?: (cmd: string) => boolean | void,
}


const ConsoleInput = forwardRef<ConsoleInputHandle, ConsoleInputProps>(function(
  {
    hints,
    error,
    onInput,
    onCommand,
  }: ConsoleInputProps,
  ref
) {

  const [command, setCommand] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hintSelected, setHintSelected] = useState(-1)

  const [focused, setFocused] = useState<boolean>(false)

  // command history: entries are immutable, adjacent duplicates are compressed
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [historyDraft, setHistoryDraft] = useState<string>('')

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    load: (cmd: string) => {
      setCommand(cmd)
      setHistoryIndex(null)
      onInput && onInput('')
      textareaRef.current?.focus()
    },
  }), [onInput])

  const submit = () => {
    const success = onCommand ? onCommand(command) : true
    if (success !== false && command.length > 0) {
      setHistory(h => h.at(-1) === command ? h : [...h, command])
    }
    setHistoryIndex(null)
    setHistoryDraft('')
    setCommand('')
    onInput && onInput('')
  }

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    submit()
  }

  const navigateHistory = (direction: 'older' | 'newer') => {
    if (direction === 'older') {
      if (history.length === 0) return
      if (historyIndex === null) {
        setHistoryDraft(command)
        setHistoryIndex(history.length - 1)
        setCommand(history[history.length - 1])
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1)
        setCommand(history[historyIndex - 1])
      }
    } else {
      if (historyIndex === null) return
      if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1)
        setCommand(history[historyIndex + 1])
      } else {
        setHistoryIndex(null)
        setCommand(historyDraft)
      }
    }
  }

  // in a multi-line command the arrows move between lines; they only browse
  // the history from the first (up) or last (down) line
  const onFirstLine = (el: HTMLTextAreaElement) => !el.value.slice(0, el.selectionStart).includes('\n')
  const onLastLine = (el: HTMLTextAreaElement) => !el.value.slice(el.selectionEnd).includes('\n')

  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = e => {
    e.stopPropagation()

    switch (e.code) {
      case 'Enter':
      case 'NumpadEnter':
        // shift+enter inserts a new line
        if (!e.shiftKey) {
          e.preventDefault()
          submit()
        }
        break
      case 'ArrowUp':
        if (onFirstLine(e.currentTarget)) {
          e.preventDefault()
          navigateHistory('older')
        }
        break
      case 'ArrowDown':
        if (onLastLine(e.currentTarget)) {
          e.preventDefault()
          navigateHistory('newer')
        }
        break
      case 'Tab':
        if (hints && hints.length > 0) {
          e.preventDefault()
          setCommand(hints[hintSelected] ?? '')
        }
        break
      case 'Escape':
        if (hints && hints.length > 0) {
          e.preventDefault()
          onInput && onInput('')
        }
        break
    }
  }

  useEffect(() => {
    setHintSelected(0)
  }, [hints])

  const className = cssClasses(
    'console-input',
    focused && 'console-input--focused'
  )
  return (
    <form
      autoComplete='off'
      onSubmit={onSubmit}
      className={className}
    >
      <textarea
        ref={textareaRef}
        name="command"
        rows={command.split('\n').length}
        spellCheck={false}
        value={command}
        onInput={e => {
          const value = (e.target as HTMLTextAreaElement).value
          setCommand(value)
          onInput && onInput(value)
        }}
        onKeyDown={onKeyDown}
        onFocus={_ => setFocused(true)}
        onBlur={_ => setFocused(false)}
      />

      {hints && hints.length > 0 &&
        <div className="console-input__hints">
          <AppSelect
            options={hints}
            selected={hintSelected}
          />
        </div>
      }

      {error &&
        <div className="console-input__error">{error}</div>
      }
    </form>
  )
})

export default ConsoleInput