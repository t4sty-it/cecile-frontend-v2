import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, deviceParamData } from "./base"

export const midiCcIn: Node = {
  params: () => [
    deviceParamData,
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'cc', type: 'output', dataType: 'signal' },
    { name: 'value', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiCcIn(actx)
}

class MidiCcIn extends MidiInputNode {

  private channel = this.createOutput()
  private cc = this.createOutput()
  private value = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      cc: this.cc,
      value: this.value,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'cc') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.cc, message.controller)
    this.setOutput(this.value, message.value)
  }
}
