import { AudioFileValue, CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import SampleProcessorUrl from './sample_processor?worker&url';

export const sample: Node = {
  category: 'Sources',
  params: () => [
    {
      name: 'file',
      type: 'param',
      dataType: 'file'
    },
    {
      name: 'position',
      type: 'input',
      dataType: 'number',
      value: 0
    },
    {
      name: 'speed',
      type: 'input',
      dataType: 'number',
      value: 0
    },
    {
      name: 'restart',
      type: 'input',
      dataType: 'number',
      value: 0
    },
    {
      name: 'output',
      type: 'output',
      dataType: 'signal'
    }
  ],

  build: actx => new Sample(actx)
}

class Sample extends CustomAudioNode {

  private speed: ConstantSourceNode
  private restart: ConstantSourceNode
  private position: ConstantSourceNode
  private worklet: Promise<AudioWorkletNode>

  constructor(actx: AudioContext) {
    super(actx)

    this.speed = this.own(actx.createConstantSource())
    this.speed.offset.value = 0
    this.speed.start()

    this.restart = this.own(actx.createConstantSource())
    this.restart.offset.value = 0
    this.restart.start()

    this.position = this.own(actx.createConstantSource())
    this.position.offset.value = 0
    this.position.start()

    this.worklet = this.createWorklet('sample-processor', SampleProcessorUrl)
    this.worklet.then(n => {
      n.connect(this.out)
      this.speed.connect(n.parameters.get('speed')!)
      this.restart.connect(n.parameters.get('restart')!)
      this.position.connect(n.parameters.get('position')!)
    })

    const fileValue: AudioFileValue = {
      setFile: file => {
        file.arrayBuffer()
          .then(data => actx.decodeAudioData(data))
          .then(buffer => {
            const channel = downmixToMono(buffer)
            this.worklet.then(n => n.port.postMessage(
              { channel, sampleRate: buffer.sampleRate },
              [channel.buffer]
            ))
          })
      }
    }

    this.params = {
      file: fileValue,
      speed: this.speed.offset,
      restart: this.restart.offset,
      position: this.position.offset,
      output: this.out,
    }
  }
}

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels == 1) return buffer.getChannelData(0).slice()

  const mixed = new Float32Array(buffer.length)
  for (let chn = 0; chn < buffer.numberOfChannels; chn++) {
    const data = buffer.getChannelData(chn)
    for (let i = 0; i < data.length; i++) mixed[i] += data[i] / buffer.numberOfChannels
  }
  return mixed
}
