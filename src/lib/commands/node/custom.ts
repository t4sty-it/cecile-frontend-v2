export interface AudioValue {
  get value(): string
  set value(v: string)
}

export class CustomAudioNode extends GainNode {

  protected in!: GainNode
  protected out!: GainNode

  constructor(actx: AudioContext) {
    super(actx, {gain: 1})
    this.in = this

    this.out = new GainNode(actx, {gain: 1})
    this.connect = this.out.connect
  }

  public params: Record<string, AudioValue | AudioParam | AudioNode> = {}
}