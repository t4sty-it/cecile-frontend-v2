export type MidiMessage =
  | { type: 'noteon', channel: number, note: number, velocity: number }
  | { type: 'noteoff', channel: number, note: number, velocity: number }
  | { type: 'polypressure', channel: number, note: number, pressure: number }
  | { type: 'cc', channel: number, controller: number, value: number }
  | { type: 'programchange', channel: number, program: number }
  | { type: 'channelpressure', channel: number, pressure: number }
  | { type: 'pitchbend', channel: number, value: number }
  | { type: 'system', status: number }

export function parseMidiMessage(data: ArrayLike<number>): MidiMessage | null {
  const status = data[0]
  if (status == null) return null

  if (status >= 0xF0) return { type: 'system', status }

  const command = status & 0xF0
  const channel = status & 0x0F

  switch (command) {
    case 0x80:
      return { type: 'noteoff', channel, note: data[1], velocity: data[2] }
    case 0x90:
      return data[2] === 0
        ? { type: 'noteoff', channel, note: data[1], velocity: data[2] }
        : { type: 'noteon', channel, note: data[1], velocity: data[2] }
    case 0xA0:
      return { type: 'polypressure', channel, note: data[1], pressure: data[2] }
    case 0xB0:
      return { type: 'cc', channel, controller: data[1], value: data[2] }
    case 0xC0:
      return { type: 'programchange', channel, program: data[1] }
    case 0xD0:
      return { type: 'channelpressure', channel, pressure: data[1] }
    case 0xE0:
      return { type: 'pitchbend', channel, value: (data[2] << 7) | data[1] }
    default:
      return null
  }
}
