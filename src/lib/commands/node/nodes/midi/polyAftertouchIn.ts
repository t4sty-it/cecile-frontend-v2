import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiPolyAftertouchIn: Node = {
  category: 'MIDI',
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'note', type: 'output', dataType: 'signal' },
    { name: 'pressure', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPolyAftertouchIn(actx)
}

class MidiPolyAftertouchIn extends MidiInputNode {

  private note = this.createOutput()
  private pressure = this.createOutput()
  private channel = this.createFilterParam()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      note: this.note,
      pressure: this.pressure,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'polypressure') return
    if (!this.channel.matches(message.channel)) return

    this.setOutput(this.note, message.note)
    this.setOutput(this.pressure, message.pressure)
  }
}
