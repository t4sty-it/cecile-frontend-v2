import { Node } from "../../node"
import { MidiMessage, noteToFrequency, pitchBendToSemitones, velocityToGain } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiKeyboardIn: Node = {
  category: 'MIDI',
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'pitchRange', type: 'param', dataType: 'number', value: 2 },
    { name: 'frequency', type: 'output', dataType: 'signal' },
    { name: 'velocity', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiKeyboardIn(actx)
}

// Like midi-note-in, but tracks all currently held notes (last-note priority)
// so that releasing one note while others are still held re-triggers the
// remaining held note instead of sending a spurious note-off.
class MidiKeyboardIn extends MidiInputNode {

  private frequency = this.createOutput()
  private velocity = this.createOutput()
  private pitchRange = this.createOutput()
  private channel = this.createFilterParam()
  private held: { note: number, velocity: number }[] = []
  private note?: number
  private bend = 0

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      pitchRange: this.pitchRange.offset,
      frequency: this.frequency,
      velocity: this.velocity,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type === 'pitchbend') {
      if (!this.channel.matches(message.channel)) return
      this.bend = message.value
      this.updateFrequency()
      return
    }

    if (message.type !== 'noteon' && message.type !== 'noteoff') return
    if (!this.channel.matches(message.channel)) return

    this.held = this.held.filter(h => h.note !== message.note)
    if (message.type === 'noteon') this.held.push({ note: message.note, velocity: message.velocity })

    const current = this.held[this.held.length - 1]

    this.note = current?.note ?? message.note
    this.updateFrequency()
    this.setOutput(this.velocity, current ? velocityToGain(current.velocity) : 0)
  }

  private updateFrequency() {
    if (this.note == null) return
    const semitones = pitchBendToSemitones(this.bend, this.pitchRange.offset.value)
    this.setOutput(this.frequency, noteToFrequency(this.note) * Math.pow(2, semitones / 12))
  }
}
