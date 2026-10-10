import { DisposableProcessor } from "../../processor"

export class SampleProcessor extends DisposableProcessor {

  private data: Float32Array | null = null
  private phase = 0
  private prevRestart = 0
  private prevPosition = 0
  private rateRatio = 1

  static get parameterDescriptors() {
    return [
      {
        name: 'speed',
        defaultValue: 0,
        automationRate: 'a-rate'
      },
      {
        name: 'restart',
        defaultValue: 0,
        automationRate: 'a-rate'
      },
      {
        name: 'position',
        defaultValue: 0,
        automationRate: 'a-rate'
      }
    ]
  }

  protected onMessage(data: unknown) {
    const msg = data as { channel?: Float32Array, sampleRate?: number }
    if (msg.channel) {
      this.data = msg.channel
      // playing back at speed=1 should preserve original pitch/duration
      // regardless of how the source file's sample rate compares to the
      // AudioContext's (`sampleRate` is the worklet global scope's rate)
      this.rateRatio = (msg.sampleRate ?? sampleRate) / sampleRate
      this.phase = 0
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0]
    const speed = parameters.speed
    const restart = parameters.restart
    const position = parameters.position
    const data = this.data
    const len = data?.length ?? 0

    for (let i = 0; i < output[0].length; i++) {
      const curRestart = restart[restart.length > 1 ? i : 0]
      if (this.prevRestart <= 0 && curRestart > 0) this.phase = 0
      this.prevRestart = curRestart

      const curPosition = position[position.length > 1 ? i : 0]
      if (curPosition != this.prevPosition) {
        const wrapped = ((curPosition % 1) + 1) % 1
        this.phase = wrapped * len
      }
      this.prevPosition = curPosition

      let sample = 0
      if (data && len > 0) {
        this.phase += speed[speed.length > 1 ? i : 0] * this.rateRatio
        this.phase = ((this.phase % len) + len) % len

        const i0 = Math.floor(this.phase)
        const i1 = (i0 + 1) % len
        const frac = this.phase - i0
        sample = data[i0] * (1 - frac) + data[i1] * frac
      }

      for (let chn = 0; chn < output.length; chn++) output[chn][i] = sample
    }

    return this.alive
  }
}

registerProcessor("sample-processor", SampleProcessor)
