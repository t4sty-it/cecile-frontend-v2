import { useCallback, useRef, useState } from "react"
import { getMidiAccess, listMidiInputs } from "@/lib/midi/access"
import { parseMidiMessage } from "@/lib/midi/message"
import { midiLearnResult, MidiLearnResult } from "@/lib/midi/learn"

export function useMidiLearn() {
  const [learning, setLearning] = useState(false)
  const cleanupRef = useRef<() => void>()

  const stop = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = undefined
    setLearning(false)
  }, [])

  const start = useCallback((onLearned: (result: MidiLearnResult) => void) => {
    stop()
    setLearning(true)

    let resolved = false

    getMidiAccess()
      .then(access => {
        if (resolved) return

        const listeners = listMidiInputs(access).map(input => {
          const handler = (ev: Event) => {
            if (resolved) return
            const message = parseMidiMessage((ev as MIDIMessageEvent).data)
            if (!message) return

            resolved = true
            stop()
            onLearned(midiLearnResult(input.name ?? '', message))
          }

          input.addEventListener('midimessage', handler)
          return { input, handler }
        })

        cleanupRef.current = () => {
          listeners.forEach(({ input, handler }) => input.removeEventListener('midimessage', handler))
        }
      })
      .catch(err => {
        console.error('midi access unavailable', err)
        setLearning(false)
      })
  }, [stop])

  return { learning, start, cancel: stop }
}
