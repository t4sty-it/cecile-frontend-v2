import { MidiMessage } from "./message"

export type MidiLearnResult = {
  nodeType: string
  paramOverrides: Record<string, string>
}

export function midiLearnResult(deviceName: string, message: MidiMessage): MidiLearnResult {
  const device = { device: deviceName }

  if (message.type === 'system')
    return { nodeType: 'midi-sys-message-in', paramOverrides: device }

  const withChannel = { ...device, channel: message.channel + '' }

  switch (message.type) {
    case 'noteon':
    case 'noteoff':
      return { nodeType: 'midi-note-in', paramOverrides: withChannel }
    case 'cc':
      return { nodeType: 'midi-cc-in', paramOverrides: { ...withChannel, cc: message.controller + '' } }
    case 'pitchbend':
      return { nodeType: 'midi-pitch-in', paramOverrides: withChannel }
    case 'channelpressure':
      return { nodeType: 'midi-aftertouch-in', paramOverrides: withChannel }
    case 'polypressure':
      return { nodeType: 'midi-poly-aftertouch-in', paramOverrides: withChannel }
    case 'programchange':
      return { nodeType: 'midi-pc-in', paramOverrides: withChannel }
  }
}
