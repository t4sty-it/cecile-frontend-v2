import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiCcIn: Node = {
  category: 'MIDI',
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'cc', type: 'param', dataType: 'string', value: '' },
    { name: 'value', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiCcIn(actx)
}

class MidiCcIn extends MidiInputNode {

  private value = this.createOutput()
  private channel = this.createFilterParam()
  private cc = this.createFilterParam()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      cc: this.cc.param,
      value: this.value,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'cc') return
    if (!this.channel.matches(message.channel)) return
    if (!this.cc.matches(message.controller)) return

    this.setOutput(this.value, message.value)
  }
}
