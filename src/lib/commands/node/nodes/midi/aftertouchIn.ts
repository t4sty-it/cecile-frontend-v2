import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, deviceParamData } from "./base"

export const midiAftertouchIn: Node = {
  params: () => [
    deviceParamData,
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'pressure', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiAftertouchIn(actx)
}

class MidiAftertouchIn extends MidiInputNode {

  private channel = this.createOutput()
  private pressure = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      pressure: this.pressure,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'channelpressure') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.pressure, message.pressure)
  }
}
