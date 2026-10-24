import { useEffect, useRef } from "react"
import { useLatest } from "./useLatest"

type Char = 'q'|'w'|'e'|'r'|'t'|'y'|'u'|'i'|'o'|'p'|'a'|'s'|'d'|'f'|'g'|'h'|'j'|'k'|'l'|'z'|'x'|'c'|'v'|'b'|'n'|'m'

type Modifiers = {
  'Control': boolean,
  'Alt': boolean,
  'Shift': boolean,
  'Meta': boolean,
  'Space': boolean,
  'Delete': boolean,
  'Backspace': boolean,
}

type Modifier = keyof Modifiers
export type Shortcut = (Modifier | Char)[]

type ShortcutAction = (e: KeyboardEvent) => void

// Uses the printed letter (e.key) so shortcuts stay mnemonic on any layout;
// lowercased because Shift+a gives e.key 'A'.
const toKey = (e: KeyboardEvent): Modifier | Char | null => {
  if (/^[a-z]$/i.test(e.key)) return e.key.toLowerCase() as Char
  for (const m of ['Shift', 'Control', 'Alt', 'Meta'] as const) {
    if (e.code.startsWith(m)) return m
  }
  if (e.code === 'Space') return 'Space'
  if (e.key === 'Backspace') return 'Backspace'
  if (e.key === 'Delete') return 'Delete'
  return null
}

// Typing in a text field must not trigger shortcuts (Backspace would delete
// the selection while editing a param).
const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export function useKeyboardShortcuts(shortcuts: [Shortcut, (e: KeyboardEvent) => void][]) {

  const shortcut = useRef<Shortcut>([])
  const addKey = (e: KeyboardEvent) => {
    if (isEditable(e.target)) return
    const key = toKey(e)
    if (key == null) return
    // Modifiers still held from a previous shortcut were cleared on keyup,
    // so re-read them from the event flags.
    const held: Modifier[] = [
      ...(e.shiftKey ? ['Shift' as const] : []),
      ...(e.ctrlKey ? ['Control' as const] : []),
      ...(e.altKey ? ['Alt' as const] : []),
      ...(e.metaKey ? ['Meta' as const] : []),
    ]
    shortcut.current = [...new Set([...shortcut.current, ...held, key])]
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
      const action = indexedShortcuts[shortcutIndex(shortcut.current)]
  
      if (action != null) {
        e.preventDefault()
        e.stopPropagation()
        action(e)
      }
  
      clearShortcut()
    }
  }

  const applyShortcutsRef = useLatest(applyShortcuts)
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => applyShortcutsRef.current(e)
    window.addEventListener('keydown', addKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', addKey)
    }
  }, [applyShortcutsRef])
}