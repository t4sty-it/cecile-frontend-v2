import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, deviceParamData } from "./base"

export const midiSysMessageIn: Node = {
  params: () => [
    deviceParamData,
    { name: 'value', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiSysMessageIn(actx)
}

class MidiSysMessageIn extends MidiInputNode {

  private value = this.createOutput()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      value: this.value,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'system') return

    this.setOutput(this.value, message.status)
  }
}
