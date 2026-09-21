import { Node } from "../../node"
import { MidiMessage, noteToFrequency, velocityToGain } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiKeyboardIn: Node = {
  params: () => [
    deviceParamData,
    channelParamData,
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
  private channel = this.createFilterParam()
  private held: { note: number, velocity: number }[] = []

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      frequency: this.frequency,
      velocity: this.velocity,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'noteon' && message.type !== 'noteoff') return
    if (!this.channel.matches(message.channel)) return

    this.held = this.held.filter(h => h.note !== message.note)
    if (message.type === 'noteon') this.held.push({ note: message.note, velocity: message.velocity })

    const current = this.held[this.held.length - 1]

    this.setOutput(this.frequency, noteToFrequency(current?.note ?? message.note))
    this.setOutput(this.velocity, current ? velocityToGain(current.velocity) : 0)
  }
}
