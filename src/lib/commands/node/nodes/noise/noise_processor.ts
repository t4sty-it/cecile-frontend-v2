import { DisposableProcessor } from "../../processor"

export class NoiseProcessor extends DisposableProcessor {
  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    });
    return this.alive
  }
}

registerProcessor("noise-processor", NoiseProcessor);