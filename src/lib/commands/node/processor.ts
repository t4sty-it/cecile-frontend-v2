// Base for AudioWorkletProcessors (imported only by *_processor.ts files, which
// run in the AudioWorkletGlobalScope). CustomAudioNode.dispose() posts
// {dispose: true}; process() should then return `this.alive` (false) so the
// browser stops calling it and can collect the node.
export abstract class DisposableProcessor extends AudioWorkletProcessor {

  protected alive = true

  constructor(opts?: AudioWorkletNodeOptions) {
    super(opts)
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data?.dispose) this.alive = false
      else this.onMessage(e.data)
    }
  }

  protected onMessage(_data: unknown) {}
}
