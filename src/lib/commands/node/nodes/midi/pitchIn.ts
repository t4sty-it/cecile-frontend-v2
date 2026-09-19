import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode } from "./base"

export const midiPitchIn: Node = {
  params: () => [
    { name: 'device', type: 'param', dataType: 'string', value: '' },
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'pitch', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPitchIn(actx)
}

class MidiPitchIn extends MidiInputNode {

  private channel = this.createOutput()
  private pitch = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      pitch: this.pitch,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'pitchbend') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.pitch, message.value)
  }
}
