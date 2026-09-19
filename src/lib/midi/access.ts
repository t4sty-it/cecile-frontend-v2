import { fuzzyFind } from "@/utils/fuzzyFind"

let accessPromise: Promise<MIDIAccess> | null = null

export function getMidiAccess(): Promise<MIDIAccess> {
  if (!accessPromise) {
    accessPromise = navigator.requestMIDIAccess().catch(err => {
      accessPromise = null
      throw err
    })
  }
  return accessPromise
}

export function listMidiInputs(access: MIDIAccess): MIDIInput[] {
  const inputs: MIDIInput[] = []
  access.inputs.forEach(input => inputs.push(input))
  return inputs
}

export function findMidiInput(access: MIDIAccess, search: string): MIDIInput | undefined {
  if (!search) return undefined
  const inputs = listMidiInputs(access)
  const match = fuzzyFind(search, inputs.map(i => i.name ?? ''))[0]
  return inputs.find(i => (i.name ?? '') === match)
}
