import { Node } from "../../node"
import { MidiMessage } from "@/lib/midi/message"
import { MidiInputNode, channelParamData, deviceParamData } from "./base"

export const midiPitchIn: Node = {
  params: () => [
    deviceParamData,
    channelParamData,
    { name: 'pitch', type: 'output', dataType: 'signal' },
  ],

  build: actx => new MidiPitchIn(actx)
}

class MidiPitchIn extends MidiInputNode {

  private pitch = this.createOutput()
  private channel = this.createFilterParam()

  constructor(actx: AudioContext) {
    super(actx)

    this.params = {
      device: this.deviceParam,
      channel: this.channel.param,
      pitch: this.pitch,
    }
  }

  protected onMidiMessage(message: MidiMessage) {
    if (message.type !== 'pitchbend') return
    if (!this.channel.matches(message.channel)) return

    this.setOutput(this.pitch, message.value)
  }
}
