import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const oscillator: Node = {
  category: 'Sources',
	params: () => [
		{
			name: 'shape',
			dataType: 'string',
			type: 'input',
			options: [
				{
					label: 'Sine',
					value: 'sine'
				},
				{
					label: 'Triangle',
					value: 'triangle'
				},
				{
					label: 'Square',
					value: 'square'
				},
				{
					label: 'Sawtooth',
					value: 'sawtooth'
				}
			],
			value: 'sine',
		},
		
		{
			name: 'frequency',
			dataType: 'number',
			type: 'input',
			value: 440,
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

	build: (actx) => new Oscillator(actx)
}

class Oscillator extends CustomAudioNode {
  private o!: OscillatorNode

  constructor(actx: AudioContext) {
    super(actx)
		const o = new OscillatorNode(actx)
    this.o = o
    this.o.start()
    this.o.connect(this.out)

		this.params = {
			shape: {
				get value() {return o.type},
				set value(v: OscillatorType) { o.type = v }
			},
			frequency: this.o.frequency,
			gain: this.out.gain,
			output: this.out,
		}
  }
}