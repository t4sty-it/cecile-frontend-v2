import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import { createWorkletNode } from "../../worklet";

import NoiseProcessorUrl from "./noise_processor?worker&url";

export const noise: Node = {
  category: 'Sources',
  params: () => [
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Noise(actx)
}

class Noise extends CustomAudioNode {
  
  constructor(actx: AudioContext) {
    super(actx)

    createWorkletNode(actx, 'noise-processor', NoiseProcessorUrl)
    .then((n) => {
      n.connect(this.out);
    })

    this.params = {
      output: this.out
    }
  }
}