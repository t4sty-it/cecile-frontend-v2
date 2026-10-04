import { createWorkletNode } from "./worklet"

export interface AudioValue {
  get value(): string
  set value(v: string)
}

export class CustomAudioNode extends GainNode {

  protected in!: GainNode
  protected out!: GainNode

  // inner nodes torn down by dispose(); sources and worklets keep running
  // (and burning audio-thread CPU) until explicitly stopped
  private owned: AudioNode[] = []
  private disposed = false

  constructor(actx: AudioContext) {
    super(actx, {gain: 1})
    this.in = this

    this.out = this.own(new GainNode(actx, {gain: 1}))
    this.connect = this.out.connect
  }

  public params: Record<string, AudioValue | AudioParam | AudioNode> = {}

  protected own<T extends AudioNode>(node: T): T {
    if (this.disposed) disposeAudioNode(node)
    else this.owned.push(node)
    return node
  }

  // worklets resolve asynchronously, so one may arrive after dispose():
  // own() disposes it straight away in that case
  protected async createWorklet(name: string, url: string, options?: AudioWorkletNodeOptions) {
    return this.own(await createWorkletNode(this.context, name, url, options))
  }

  public dispose() {
    if (this.disposed) return
    this.disposed = true
    this.disconnect()
    this.owned.forEach(disposeAudioNode)
    this.owned = []
  }
}

function disposeAudioNode(node: AudioNode) {
  if (node instanceof AudioScheduledSourceNode) node.stop()
  // see DisposableProcessor: lets process() return false
  if (node instanceof AudioWorkletNode) node.port.postMessage({ dispose: true })
  node.disconnect()
}
