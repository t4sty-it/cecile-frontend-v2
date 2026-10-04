import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import QuantizerProcessorUrl from './quantizer_processor?worker&url';

const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  'minor harmonic': [0, 2, 3, 5, 7, 8, 11],
  pentatonic: [0, 2, 4, 7, 9],
}

export const quantizer: Node = {
  category: 'Control',
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal'
    },
    {
      name: 'offset',
      type: 'param',
      dataType: 'number',
      value: 60
    },
    {
      name: 'scale',
      type: 'param',
      dataType: 'string',
      options: [
        { label: 'Major', value: 'major' },
        { label: 'Minor harmonic', value: 'minor harmonic' },
        { label: 'Pentatonic', value: 'pentatonic' },
      ],
      value: 'major'
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Quantizer(actx)
}

class Quantizer extends CustomAudioNode {

  private offset: ConstantSourceNode
  private worklet?: AudioWorkletNode
  private scaleName: string = 'major'

  constructor(actx: AudioContext) {
    super(actx)

    this.offset = this.own(actx.createConstantSource())
    this.offset.offset.value = 60
    this.offset.start()

    this.createWorklet('quantizer-processor', QuantizerProcessorUrl, {
      numberOfInputs: 1,
      numberOfOutputs: 1
    })
    .then(n => {
      this.worklet = n
      this.in.connect(n, 0, 0)
      this.offset.connect(n.parameters.get('offset')!)
      n.connect(this.out)
      n.port.postMessage({ scale: SCALES[this.scaleName] })
    })

    const scaleParam = {} as { value: string }
    Object.defineProperty(scaleParam, 'value', {
      get: () => this.scaleName,
      set: (v: string) => {
        this.scaleName = v
        this.worklet?.port.postMessage({ scale: SCALES[v] ?? SCALES.major })
      }
    })

    this.params = ({
      input: this.in,
      offset: this.offset.offset,
      scale: scaleParam,
      output: this.out
    })
  }
}
