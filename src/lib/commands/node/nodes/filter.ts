import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const filter: Node = {
  category: 'Processors',
  params: () => [
    {
      name: 'input',
      type: 'input',
      dataType: 'signal',
    },
    {
      name: 'shape',
      options: [
        {label: 'Lowpass', value: 'lowpass'},
        {label: 'Highpass', value: 'highpass'},
        {label: 'Bandpass', value: 'bandpass'},
        {label: 'Lowshelf', value: 'lowshelf'},
        {label: 'Highshelf', value: 'highshelf'},
        {label: 'Peaking', value: 'peaking'},
        {label: 'Notch', value: 'notch'},
        {label: 'Allpass', value: 'allpass'},
      ],
      dataType: 'string',
      type: 'input',
      value: 'lowpass'
    },
    
    {
      name: 'frequency',
      dataType: 'number',
      type: 'input',
      value: 440,
    },

    {
      name: 'detune',
      dataType: 'number',
      type: 'input',
      value: 0,
    },

    {
      name: 'q',
      dataType: 'number',
      type: 'input',
      min: 1,
      value: 1,
    },

    {
      name: 'gain',
      dataType: 'number',
      type: 'input',
      value: 0
    },

    {
      name: 'output',
      dataType: 'signal',
      type: 'output',
    }
  ],

  build: actx => new Filter(actx)
}

class Filter extends CustomAudioNode {
  private f!: BiquadFilterNode

  constructor(actx: AudioContext) {
    super(actx)
    this.f = new BiquadFilterNode(
      actx,
      {
        frequency: 440,
        detune: 0,
        Q: 1,
        gain: 0,
        type: 'lowpass'
      }
    )

    this.in.connect(this.f)
    this.f.connect(this.out)

    const f = this.f

    this.params = {
      input: this.in,
      shape: {
        get value() { return f.type },
        set value(v: BiquadFilterType) { f.type = v }
      },
      frequency: this.f.frequency,
      detune: this.f.detune,
      q: this.f.Q,
      gain: this.f.gain,
      output: this.out,
    }
  }
}