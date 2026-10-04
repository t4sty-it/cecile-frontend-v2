import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const constant: Node = {
  category: 'Sources',
  params: () => [
    {
      name: 'value',
      dataType: 'number',
      type: 'param',
      value: 0
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Constant(actx)
}

class Constant extends CustomAudioNode {
  
  private c!: ConstantSourceNode

  constructor(actx: AudioContext) {
    super(actx)
    this.c = this.own(new ConstantSourceNode(actx, {offset: 0}))
    this.c.start()
    this.c.connect(this.out)

    this.params = {
      value: this.c.offset,
      output: this.out,
    }
  }
}