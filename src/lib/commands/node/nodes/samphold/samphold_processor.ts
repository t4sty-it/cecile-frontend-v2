import { DisposableProcessor } from "../../processor"

export class SampholdProcessor extends DisposableProcessor {

  private held: number = 0
  private armed: boolean = true

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const [signalIn, thresholdIn, triggerIn] = inputs
    const output = outputs[0]
    const numSamples = output[0]?.length ?? 0

    const signalChannel = signalIn?.[0]
    const thresholdChannel = thresholdIn?.[0]
    const triggerChannel = triggerIn?.[0]

    for (let sample = 0; sample < numSamples; sample++) {
      const signal = signalChannel?.[sample] ?? 0
      const threshold = thresholdChannel?.[sample] ?? 0
      const trigger = triggerChannel?.[sample] ?? 0

      // only re-sample on the rising edge (trigger crossing above threshold);
      // once armed and above threshold, stays held until trigger drops back
      // below threshold and rises above it again
      if (trigger > threshold) {
        if (this.armed) {
          this.held = signal
          this.armed = false
        }
      } else {
        this.armed = true
      }

      for (let chn = 0; chn < output.length; chn++) {
        output[chn][sample] = this.held
      }
    }

    return this.alive
  }
}

registerProcessor('samphold-processor', SampholdProcessor)
