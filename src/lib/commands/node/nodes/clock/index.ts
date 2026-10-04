import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import { createWorkletNode } from "../../worklet";
import ClockProcessorUrl from './clock_processor?worker&url';

export const clock: Node = {
  category: 'Sources',
	params: () => [
		{
			name: 'bpm',
			dataType: 'number',
			type: 'input',
			value: 120,
		},

		{
			name: 'pulseWidth',
			dataType: 'number',
			type: 'input',
			value: 0.5,
			min: 0,
			max: 1,
		},

		{
			name: 'output',
			dataType: 'signal',
			type: 'output'
		}
	],

	build: (actx) => new Clock(actx)
}

class Clock extends CustomAudioNode {
	private bpm: ConstantSourceNode
	private pulseWidth: ConstantSourceNode

	constructor(actx: AudioContext) {
		super(actx)

		this.bpm = actx.createConstantSource()
		this.bpm.start()

		this.pulseWidth = actx.createConstantSource()
		this.pulseWidth.start()

		createWorkletNode(actx, 'clock-processor', ClockProcessorUrl)
		.then(n => {
			this.bpm.connect(n.parameters.get('bpm')!)
			this.pulseWidth.connect(n.parameters.get('pulseWidth')!)
			n.connect(this.out)
		})

		this.params = {
			bpm: this.bpm.offset,
			pulseWidth: this.pulseWidth.offset,
			output: this.out,
		}
	}
}
