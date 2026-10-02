import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import { createWorkletNode } from "../../worklet";
import ClipProcessorUrl from './clip_processor?worker&url'

export const clip: Node = {
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'min',
      type: 'param',
      dataType: 'number',
      value: 0
    },
    {
      name: 'max',
      type: 'param',
      dataType: 'number',
      value: 1
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    },
  ],

  build: actx => new Clip(actx)
}

class Clip extends CustomAudioNode {

  private min: GainNode
  private max: GainNode

  constructor(actx: AudioContext) {
    super(actx)

    this.min = actx.createGain()
    this.max = actx.createGain()

    createWorkletNode(actx, 'clip-processor', ClipProcessorUrl)
    .then(n => {
      this.in.connect(n)
      n.connect(this.out)
      this.min.connect((n.parameters as any).get('min'))
      this.max.connect((n.parameters as any).get('max'))
    })

    this.params = ({
      input: this.in,
      output: this.out,
      min: this.min.gain,
      max:this.max.gain
    })
  }
}