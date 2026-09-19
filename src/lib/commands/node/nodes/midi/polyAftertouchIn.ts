import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, deviceParamData } from "./base"

export const midiPolyAftertouchIn: Node = {
  params: () => [
    deviceParamData,
    { name: 'channel', type: 'output', dataType: 'signal' },
    { name: 'note', type: 'output', dataType: 'signal' },
    { name: 'pressure', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPolyAftertouchIn(actx)
}

class MidiPolyAftertouchIn extends MidiInputNode {

  private channel = this.createOutput()
  private note = this.createOutput()
  private pressure = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel,
      note: this.note,
      pressure: this.pressure,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'polypressure') return

    this.setOutput(this.channel, message.channel)
    this.setOutput(this.note, message.note)
    this.setOutput(this.pressure, message.pressure)
  }
}
