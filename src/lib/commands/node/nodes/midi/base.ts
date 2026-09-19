import { ParamData } from "@/data/Param"
import { AudioValue, CustomAudioNode } from "../../custom"
import { findMidiInput, getMidiAccess } from "@/lib/midi/access"
import { MidiMessage, parseMidiMessage } from "@/lib/midi/message"

export const deviceParamData: ParamData = {
  name: 'device',
  type: 'param',
  dataType: 'string',
  dynamicOptions: 'midi-input-device',
  value: ''
}

export abstract class MidiInputNode extends CustomAudioNode {

  private search = ''
  private input?: MIDIInput
  protected readonly deviceParam: AudioValue

  constructor(actx: AudioContext) {
    super(actx)

    this.deviceParam = Object.defineProperty({} as AudioValue, 'value', {
      enumerable: true,
      get: () => this.search,
      set: (v: string) => { this.search = v; this.attach() }
    })

    getMidiAccess()
      .then(access => {
        access.addEventListener('statechange', () => this.attach())
        this.attach()
      })
      .catch(err => console.error('midi access unavailable', err))
  }

  protected abstract onMidiMessage(message: MidiMessage): void

  protected createOutput(): ConstantSourceNode {
    const c = new ConstantSourceNode(this.context)
    c.start()
    return c
  }

  protected setOutput(output: ConstantSourceNode, value: number) {
    output.offset.setValueAtTime(value, this.context.currentTime)
  }

  private attach() {
    getMidiAccess().then(access => {
      if (this.input) this.input.onmidimessage = null
      this.input = findMidiInput(access, this.search)
      if (this.input) {
        this.input.onmidimessage = (ev) => {
          const data = (ev as MIDIMessageEvent).data
          const message = parseMidiMessage(data)
          if (message) this.onMidiMessage(message)
        }
      }
    })
  }
}
