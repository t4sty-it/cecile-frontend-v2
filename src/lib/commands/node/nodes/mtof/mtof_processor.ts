export class MtofProcessor extends AudioWorkletProcessor {

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0]
    const output = outputs[0]

    for (let chn = 0; chn < output.length; chn++) {
      const inChannel = input?.[chn]
      const outChannel = output[chn]
      for (let sample = 0; sample < outChannel.length; sample++) {
        const note = inChannel?.[sample] ?? 0
        outChannel[sample] = 440 * Math.pow(2, (note - 69) / 12)
      }
    }

    return true
  }
}

registerProcessor('mtof-processor', MtofProcessor)
