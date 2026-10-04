import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import { createWorkletNode } from "../../worklet";
import MtofProcessorUrl from './mtof_processor?worker&url';

export const mtof: Node = {
  category: 'Control',
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Mtof(actx)
}

class Mtof extends CustomAudioNode {

  constructor(actx: AudioContext) {
    super(actx)

    createWorkletNode(actx, 'mtof-processor', MtofProcessorUrl, {
      numberOfInputs: 1,
      numberOfOutputs: 1
    })
    .then(n => {
      this.in.connect(n)
      n.connect(this.out)
    })

    this.params = ({
      input: this.in,
      output: this.out
    })
  }
}
