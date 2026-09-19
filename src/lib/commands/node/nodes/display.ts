import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const display: Node = {
  params: () => [
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
  private data: Float32Array
  private lastValue?: number

  constructor(actx: AudioContext) {
    super(actx)

    this.analyser = new AnalyserNode(actx, { fftSize: 32 })
    this.data = new Float32Array(this.analyser.fftSize)
    this.connect(this.analyser)

    this.params = {
      input: this
    }

    this.poll()
  }

  private poll = () => {
    this.analyser.getFloatTimeDomainData(this.data)
    const value = this.data[this.data.length - 1]

    if (this.lastValue == null || Math.abs(value - this.lastValue) > 1e-6) {
      this.lastValue = value
      console.log('display:', value)
    }

    requestAnimationFrame(this.poll)
  }
}
