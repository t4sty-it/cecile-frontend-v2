import { useLayoutEffect, useRef } from "react"

/**
 * **NOTE** Replace with `useEffectEvent` when upgrading to React 19
 * 
 * Ref that always holds the latest `value`, so long-lived listeners
 * can call fresh callbacks without being re-subscribed on every render.
 * When to use it
 * 
 * Use it when a long-lived subscription needs to call a callback that changes between renders:
 * - window/document listeners: the keyboard shortcuts and node dragging here
 * - setInterval/setTimeout callbacks
 * - MIDI input onmidimessage, an audio worklet's port.onmessage, WebSocket handlers
 * - custom hooks that take a callback prop and subscribe to something on its behalf (useKeyboardShortcuts is one)
 * 
 * Don't use it when:
 * - The effect should re-run when the value changes. The audio fix in screens/graph/index.tsx is the opposite case: the effect's whole job is to react to graph.nodes and initialized, so those belong in the deps directly. Use useLatest for callbacks the effect calls, not data it reacts to.
 * - The value controls how you subscribe. If an event name, element or MIDI input id changes, you need to resubscribe, so it must be a real dependency.
 * - You need the value for rendering. Use state or props.
 * - Resubscribing is cheap and correct. Then just list the dependency; it's simpler.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
