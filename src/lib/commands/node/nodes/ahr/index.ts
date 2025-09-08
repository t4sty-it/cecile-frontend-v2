import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import { createWorkletNode } from "../../worklet";
import AhrProcessorUrl from './ahr_processor?url';

export const ahr: Node = {
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'attack',
      type: 'param',
      dataType: 'number',
      value: 0
    },
    {
      name: 'release',
      type: 'param',
      dataType: 'number',
      value: 0
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Ahr(actx)
}

class Ahr extends CustomAudioNode {

  private attack: ConstantSourceNode
  private release: ConstantSourceNode

  constructor(actx: AudioContext) {
    super(actx)

    this.attack = actx.createConstantSource()
    this.attack.start()
    this.release = actx.createConstantSource()
    this.release.start()

    createWorkletNode(actx, 'ahr-processor', AhrProcessorUrl)
    .then((n) => {
      this.in.connect(n)
      n.connect(this.out);
      console.log({n})

      this.attack.connect((n.parameters as any).get('attack'))
      this.release.connect((n.parameters as any).get('release'))
    })

    this.params = ({
      input: this.in,
      output: this.out,
      attack: this.attack.offset,
      release: this.release.offset
    })
  }

}