export class QuantizerProcessor extends AudioWorkletProcessor {

  private scale: number[] = [0, 2, 4, 5, 7, 9, 11]

  static get parameterDescriptors() {
    return [
      {
        name: 'offset',
        defaultValue: 0,
        automationRate: 'k-rate'
      }
    ]
  }

  constructor(opts: AudioWorkletNodeOptions | undefined) {
    super(opts)
    this.port.onmessage = (e: MessageEvent) => {
      if (Array.isArray(e.data?.scale)) this.scale = e.data.scale
    }
  }

  // nearest integer to v whose (semitone mod 12) is one of this.scale's degrees;
  // scale degrees are absolute (unrooted) pitch classes, so we check the
  // octave straddling v plus its neighbours to handle wraparound at the edges
  private quantize(v: number): number {
    const octave = Math.floor(v / 12)
    let best = octave * 12 + this.scale[0]
    let bestDist = Math.abs(best - v)

    for (let o = -1; o <= 1; o++) {
      const base = (octave + o) * 12
      for (let i = 0; i < this.scale.length; i++) {
        const candidate = base + this.scale[i]
        const dist = Math.abs(candidate - v)
        if (dist < bestDist) {
          bestDist = dist
          best = candidate
        }
      }
    }

    return best
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0]
    const output = outputs[0]
    const offset = parameters.offset[0]

    for (let chn = 0; chn < output.length; chn++) {
      const inChannel = input?.[chn]
      const outChannel = output[chn]
      for (let sample = 0; sample < outChannel.length; sample++) {
        const signal = inChannel?.[sample] ?? 0
        outChannel[sample] = this.quantize(signal + offset)
      }
    }

    return true
  }
}

registerProcessor('quantizer-processor', QuantizerProcessor)
