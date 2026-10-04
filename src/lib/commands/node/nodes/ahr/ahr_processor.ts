import { DisposableProcessor } from "../../processor"

export class AhrProcessor extends DisposableProcessor {

  private out: number = 0

  static get parameterDescriptors() {
        return [
            {
                name: 'attack',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: 'k-rate'
            },
            {
                name: 'release',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: 'k-rate'
            }
        ]
    }

    constructor(opts: AudioWorkletNodeOptions | undefined) {
        super(opts)
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        const input = inputs[0]
        const output = outputs[0]
        const pAtk = parameters.attack[0]
        const pRel = parameters.release[0]

        for (let chn = 0; chn < input.length; chn++) {
            const inChannel = input[chn]
            for (let sample = 0; sample < inChannel.length; sample++) {

                const attack = 1 / (Math.pow(pAtk, 2) * (1e6 - 1e3) + 1e3)
                const release = 1 / (Math.pow(pRel, 2) * (1e6 - 1e3) + 1e3)
                const curSamp = inChannel[sample]
                const sign = this.out < curSamp ? 1 : this.out == curSamp ? 0 : -1
                const delta = sign * (sign > 0 ? attack : release)
                const amp = this.out + delta
                const out = Math.min(Math.max(amp, 0), 1) || 0

                output[chn][sample] = this.out = out
            }
        }

        return this.alive
    }
}

registerProcessor("ahr-processor", AhrProcessor)