import { AudioValue, CustomAudioNode } from "../custom";
import { Node } from "../node";

export const display: Node = {
  category: 'Output',
  params: () => [
    {
      name: 'label',
      type: 'param',
      dataType: 'string',
      value: 'display'
    },
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    }
  ],

  build: actx => new Display(actx)
}

class Display extends CustomAudioNode {

  private analyser: AnalyserNode
  private data: Float32Array<ArrayBuffer>
  private lastValue?: number
  private label = 'display'
  private readonly labelParam: AudioValue

  constructor(actx: AudioContext) {
    super(actx)

    this.analyser = new AnalyserNode(actx, { fftSize: 32 })
    this.data = new Float32Array(this.analyser.fftSize)
    this.connect(this.analyser)

    this.labelParam = Object.defineProperty({} as AudioValue, 'value', {
      enumerable: true,
      get: () => this.label,
      set: (v: string) => { this.label = v }
    })

    this.params = {
      label: this.labelParam,
      input: this
    }

    this.poll()
  }

  private poll = () => {
    this.analyser.getFloatTimeDomainData(this.data)
    const value = this.data[this.data.length - 1]

    if (this.lastValue == null || Math.abs(value - this.lastValue) > 1e-6) {
      this.lastValue = value
      console.log(`${this.label}: ${value}`)
    }

    requestAnimationFrame(this.poll)
  }
}
