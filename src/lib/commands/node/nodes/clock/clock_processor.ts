declare const sampleRate: number

export class ClockProcessor extends AudioWorkletProcessor {

  private phase = 0

  static get parameterDescriptors() {
    return [
      {
        // the actual value always arrives via the connected ConstantSourceNode
        // (AudioParam automation is additive, so this must stay 0)
        name: 'bpm',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'a-rate'
      },
      {
        name: 'pulseWidth',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate'
      }
    ]
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0]
    const bpm = parameters.bpm
    const pulseWidth = parameters.pulseWidth
    const numSamples = output[0]?.length ?? 0

    for (let sample = 0; sample < numSamples; sample++) {
      const curBpm = bpm.length > 1 ? bpm[sample] : bpm[0]
      const curPulseWidth = pulseWidth.length > 1 ? pulseWidth[sample] : pulseWidth[0]
      const value = this.phase < curPulseWidth ? 1 : 0

      for (let chn = 0; chn < output.length; chn++) {
        output[chn][sample] = value
      }

      const freq = curBpm / 60
      this.phase = (this.phase + freq / sampleRate) % 1
    }

    return true
  }
}

registerProcessor('clock-processor', ClockProcessor)
