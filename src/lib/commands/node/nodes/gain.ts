import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const gain: Node = {
  params: () => [
    {
      name: 'input',
      dataType: 'signal',
      type: 'input',
    },

    {
      name: 'gain',
      dataType: 'number',
      type: 'input',
      value: 1
    },

    {
      name: 'output',
      dataType: 'signal',
      type: 'output'
    }
  ],

  build: actx => new Gain(actx)
}

class Gain extends CustomAudioNode {
  constructor(actx: AudioContext) {
    super(actx)
    this.connect(this.out)

    this.params = {
      input: this,
      gain: this.gain,
      output: this.out
    }
  }
}