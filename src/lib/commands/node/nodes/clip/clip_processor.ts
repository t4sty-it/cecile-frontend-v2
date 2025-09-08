class ClipProcessor extends AudioWorkletProcessor {

	static get parameterDescriptors() {
		return [
			{
				name: 'min',
				defaultValue: 0,
				automationRate: 'k-rate'
			},
			{
				name: 'max',
				defaultValue: 1,
				automationRate: 'k-rate'
			}
		]
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
		const input = inputs[0]
		const output = outputs[0]

		const min = parameters.min[0]
		const max = parameters.max[0]

		for (let chn = 0; chn < input.length; chn++) {
			const inFrame = input[chn]

			for (let sampleIdx = 0; sampleIdx < inFrame.length; sampleIdx++) {

				const sampleValue = inFrame[sampleIdx]
				output[chn][sampleIdx] = Math.max(min, Math.min(max, sampleValue))
			
			}
		}

		return true
	}
}

registerProcessor('clip-processor', ClipProcessor)