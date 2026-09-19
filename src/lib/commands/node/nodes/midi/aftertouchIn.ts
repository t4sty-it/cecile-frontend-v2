import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiAftertouchIn: Node = {
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'pressure', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiAftertouchIn(actx)
}

class MidiAftertouchIn extends MidiInputNode {

  private pressure = this.createOutput()
  private channel = this.createFilterParam()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      pressure: this.pressure,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'channelpressure') return
    if (!this.channel.matches(message.channel)) return

    this.setOutput(this.pressure, message.pressure)
  }
}
