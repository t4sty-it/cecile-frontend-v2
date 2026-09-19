import { useEffect, useState } from "react"
import { getMidiAccess, listMidiInputs } from "@/lib/midi/access"

export function useMidiInputNames(enabled: boolean): string[] {
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let access: MIDIAccess | undefined

    const update = () => {
      if (access) setNames(listMidiInputs(access).map(i => i.name ?? ''))
    }

    getMidiAccess()
      .then(a => {
        if (disposed) return
        access = a
        access.addEventListener('statechange', update)
        update()
      })
      .catch(err => console.error('midi access unavailable', err))

    return () => {
      disposed = true
      access?.removeEventListener('statechange', update)
    }
  }, [enabled])

  return names
}
