export async function createWorkletNode(
  context: BaseAudioContext,
  name: string,
  url: string,
  options?: AudioWorkletNodeOptions
) {
  // ensure audioWorklet has been loaded
  try {
    return new AudioWorkletNode(context, name, options);
  } catch {
    console.warn('adding module ' + name + ' to audio worklet')
    await context.audioWorklet.addModule(url);
    return new AudioWorkletNode(context, name, options);
  }
}