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

export const channelParamData: ParamData = {
  name: 'channel',
  type: 'param',
  dataType: 'string',
  value: ''
}

export abstract class MidiInputNode extends CustomAudioNode {

  private search = ''
  private input?: MIDIInput
  private detached = false
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
        access.addEventListener('statechange', this.attach)
        this.attach()
      })
      .catch(err => console.error('midi access unavailable', err))
  }

  protected abstract onMidiMessage(message: MidiMessage): void

  protected createOutput(): ConstantSourceNode {
    const c = this.own(new ConstantSourceNode(this.context))
    c.start()
    return c
  }

  protected setOutput(output: ConstantSourceNode, value: number) {
    output.offset.setValueAtTime(value, this.context.currentTime)
  }

  protected createFilterParam(): { param: AudioValue, matches: (value: number) => boolean } {
    let filter = ''

    const param = Object.defineProperty({} as AudioValue, 'value', {
      enumerable: true,
      get: () => filter,
      set: (v: string) => { filter = v }
    })

    const matches = (value: number) => filter === '' || parseInt(filter, 10) === value

    return { param, matches }
  }

  private readonly handleMessage = (ev: Event) => {
    const data = (ev as MIDIMessageEvent).data
    const message = parseMidiMessage(data)
    if (message) this.onMidiMessage(message)
  }

  public dispose() {
    this.detached = true
    this.input?.removeEventListener('midimessage', this.handleMessage)
    this.input = undefined
    getMidiAccess()
      .then(access => access.removeEventListener('statechange', this.attach))
      .catch(() => {})
    super.dispose()
  }

  private readonly attach = () => {
    getMidiAccess().then(access => {
      if (this.detached) return
      if (this.input) this.input.removeEventListener('midimessage', this.handleMessage)
      this.input = findMidiInput(access, this.search)
      if (this.input) this.input.addEventListener('midimessage', this.handleMessage)
    })
  }
}
