import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import SampholdProcessorUrl from './samphold_processor?worker&url';

export const samphold: Node = {
  category: 'Control',
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'threshold',
      type: 'input',
      dataType: 'number',
      value: 0
    },
    {
      name: 'trigger',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new SampleHold(actx)
}

class SampleHold extends CustomAudioNode {

  private threshold: ConstantSourceNode
  private trigger: GainNode

  constructor(actx: AudioContext) {
    super(actx)

    this.threshold = this.own(actx.createConstantSource())
    this.threshold.start()
    this.trigger = this.own(actx.createGain())

    this.createWorklet('samphold-processor', SampholdProcessorUrl, {
      numberOfInputs: 3,
      numberOfOutputs: 1
    })
    .then(n => {
      this.in.connect(n, 0, 0)
      this.threshold.connect(n, 0, 1)
      this.trigger.connect(n, 0, 2)
      n.connect(this.out)
    })

    this.params = ({
      input: this.in,
      threshold: this.threshold.offset,
      trigger: this.trigger,
      output: this.out
    })
  }
}
