import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiPcIn: Node = {
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'program', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPcIn(actx)
}

class MidiPcIn extends MidiInputNode {

  private program = this.createOutput()
  private channel = this.createFilterParam()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      program: this.program,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'programchange') return
    if (!this.channel.matches(message.channel)) return

    this.setOutput(this.program, message.program)
  }
}
