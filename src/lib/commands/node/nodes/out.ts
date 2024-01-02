import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const out: Node = {
  params: () => [
    {
      name: 'signal',
      type: 'input',
      dataType: 'signal'
    }
  ],
// TODO return audio graph instead of custom audio node
  build: actx => new Out(actx)
}

class Out extends CustomAudioNode {

  constructor(actx: AudioContext) {
    super(actx)
    this.connect(actx.destination)

    this.params = {
      signal: this
    }
  }
}