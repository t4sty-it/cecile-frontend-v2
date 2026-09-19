import { Node } from "../../node"
import { MidiMessage, noteToFrequency, velocityToGain } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiNoteIn: Node = {
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'frequency', type: 'output', dataType: 'signal' },
    { name: 'velocity', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiNoteIn(actx)
}

class MidiNoteIn extends MidiInputNode {

  private frequency = this.createOutput()
  private velocity = this.createOutput()
  private channel = this.createFilterParam()

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

    this.setOutput(this.frequency, noteToFrequency(message.note))
    this.setOutput(
      this.velocity,
      message.type === 'noteoff' ? 0 : velocityToGain(message.velocity)
    )
  }
}
