import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import AhrProcessorUrl from './ahr_processor?worker&url';

export const ahr: Node = {
  category: 'Control',
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

    this.attack = this.own(actx.createConstantSource())
    this.attack.start()
    this.release = this.own(actx.createConstantSource())
    this.release.start()

    this.createWorklet('ahr-processor', AhrProcessorUrl)
    .then((n) => {
      this.in.connect(n)
      n.connect(this.out);

      this.attack.connect(n.parameters.get('attack')!)
      this.release.connect(n.parameters.get('release')!)
    })

    this.params = ({
      input: this.in,
      output: this.out,
      attack: this.attack.offset,
      release: this.release.offset
    })
  }

}