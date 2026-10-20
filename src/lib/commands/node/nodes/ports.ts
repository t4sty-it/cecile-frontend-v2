import { CustomAudioNode } from "../custom";
import { Node } from "../node";

const passthrough: Node = {
  category: 'Groups',
  params: () => [
    {
      name: 'input',
      dataType: 'signal',
      type: 'input',
    },
    {
      name: 'output',
      dataType: 'signal',
      type: 'output'
    }
  ],

  build: actx => new Passthrough(actx)
}

export const inlet = passthrough
export const outlet = passthrough

class Passthrough extends CustomAudioNode {
  constructor(actx: AudioContext) {
    super(actx)
    this.connect(this.out)

    this.params = {
      input: this,
      output: this.out
    }
  }
}
