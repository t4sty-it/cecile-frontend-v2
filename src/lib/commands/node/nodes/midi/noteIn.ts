import { Node } from "../../node"
import { MidiMessage, noteToFrequency, velocityToGain } from "@/lib/midi/message"
import { MidiInputNode } from "./base"

export const midiNoteIn: Node = {
  params: () => [
    { name: 'device', type: 'param', dataType: 'string', value: '' },
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'frequency', type: 'output', dataType: 'signal' },
    { name: 'velocity', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiNoteIn(actx)
}

class MidiNoteIn extends MidiInputNode {

  private channel = this.createOutput()
  private frequency = this.createOutput()
  private velocity = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      frequency: this.frequency,
      velocity: this.velocity,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'noteon' && message.type !== 'noteoff') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.frequency, noteToFrequency(message.note))
    this.setOutput(this.velocity, velocityToGain(message.velocity))
  }
}
