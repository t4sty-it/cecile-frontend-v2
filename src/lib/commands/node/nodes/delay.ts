import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const delay: Node = {
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'time',
      type: 'input',
      dataType: 'number',
      max: 60,
      value: 0,
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Delay(actx)
}

class Delay extends CustomAudioNode {
  private d!: DelayNode

  constructor(actx: AudioContext) {
    super(actx)
    this.d = new DelayNode(actx, { maxDelayTime: 60, delayTime: 0 })
    this.in.connect(this.d)
    this.d.connect(this.out)
    this.params = {
      input: this.in,
      time: this.d.delayTime,
      output: this.out
    }
  }

}