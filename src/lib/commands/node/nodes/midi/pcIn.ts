import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, deviceParamData } from "./base"

export const midiPcIn: Node = {
  params: () => [
    deviceParamData,
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'program', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPcIn(actx)
}

class MidiPcIn extends MidiInputNode {

  private channel = this.createOutput()
  private program = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      program: this.program,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'programchange') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.program, message.program)
  }
}
