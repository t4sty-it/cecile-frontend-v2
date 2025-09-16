import { useEffect, useRef } from "react"

type Char = 'q'|'w'|'e'|'r'|'t'|'y'|'u'|'i'|'o'|'p'|'a'|'s'|'d'|'f'|'g'|'h'|'j'|'k'|'l'|'z'|'x'|'c'|'v'|'b'|'n'|'m'

type Modifiers = {
  'Control': boolean,
  'Alt': boolean,
  'Shift': boolean,
  'Meta': boolean,
  'Space': boolean,
}

type Modifier = keyof Modifiers
export type Shortcut = (Modifier | Char)[]

type ShortcutAction = (e: KeyboardEvent) => void

export function useKeyboardShortcuts(shortcuts: [Shortcut, (e: KeyboardEvent) => void][]) {

  // const [shortcut, setShortcut] = useState<Shortcut>([])
  const shortcut = useRef<Shortcut>([])
  const addKey = (e: KeyboardEvent) => {
    console.log(e.key, e.code)
    shortcut.current = [
      ...shortcut.current,
      e.code.startsWith('Key')
        ? e.key as Char
        : e.code.startsWith('Shift')
          ? 'Shift'
          : e.code.startsWith('Control')
            ? 'Control'
            : e.code as Modifier
    ].filter(Boolean)
  }
  const clearShortcut = () => shortcut.current = []

  const shortcutIndex = (shortcut: Shortcut) => shortcut.toSorted().join('+')
  const indexedShortcuts = Object.fromEntries(
    shortcuts.map(([shortcut, action]) => [
      shortcutIndex(shortcut),
      action
    ] as [string, ShortcutAction])
  )

  const applyShortcuts = (e: KeyboardEvent) => {
    if (shortcut.current.length) {
      console.log({shortcut: shortcut.current})
      const action = indexedShortcuts[shortcutIndex(shortcut.current)]
  
      if (action != null) {
        e.preventDefault()
        e.stopPropagation()
        action(e)
      }
  
      clearShortcut()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', addKey)
    window.addEventListener('keyup', applyShortcuts)
    return () => {
      window.removeEventListener('keyup', applyShortcuts)
      window.removeEventListener('keydown', addKey)
    }
  }, [])
}