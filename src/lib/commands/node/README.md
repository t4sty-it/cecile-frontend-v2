# Writing a module

A module (called a "node" in the code) is two things:

1. **A description**: the list of inlets, outlets and knobs the UI draws and the language can
   select, connect and set (`params()`).
2. **An audio implementation**: a `CustomAudioNode` built from real Web Audio nodes (`build()`).

`src/lib/audio_graph/AudioGraph.ts` keeps the two in sync. It builds one `CustomAudioNode`
per graph node. Then it looks each param up **by name** in the node's `params` map, wires edges
between those objects, and writes param values into them. When the node is deleted, it calls
`dispose()`.

## Files

| File | What it is |
|------|------------|
| `node.ts` | The `Node` type every module exports: `{ category, params, build }`. |
| `custom.ts` | `CustomAudioNode`: the base class for every module's audio side. |
| `worklet.ts` | `createWorkletNode`: loads a worklet module on first use and instantiates it. |
| `processor.ts` | `DisposableProcessor`: base class for `AudioWorkletProcessor`s. |
| `nodes/index.ts` | The registry: the key is the module's name in the language and palette. |

## 1. Describe the params

`params()` returns a list of `ParamData` (`src/data/Param.ts`). It is a function so each
node instance gets fresh objects.

| `type` | `dataType` | Meaning | Must map to (in `params`) |
|--------|-----------|---------|---------------------------|
| `'output'` | `'signal'` | An outlet. | `AudioNode` (usually `this.out`) |
| `'input'` | `'signal'` | A patchable inlet with no value. | `AudioNode` |
| `'input'` | `'number'` | A knob that can **also** be patched (the signal is added to the knob value). | `AudioParam` |
| `'param'` | `'number'` | A knob that **cannot** be patched. | `AudioParam` |
| `'input'`/`'param'` | `'string'` | A text field or dropdown (`options`). Never patchable. | `AudioValue` (`{ get value(); set value(v) }`) |

- `value` is the default. The reconciler applies it with `setValueAtTime` (numbers) or by
  assigning `.value` (strings).
- `min`/`max` bound the UI control. `options` turns a string param into a dropdown.
- Name the main inlet `input` and the main outlet `output`. Connectors use these names when
  none is given (`osc > filter`).
- The keys in `this.params` **must** match the `name`s exactly. A missing key fails at runtime,
  not at compile time.

## 2. Build the audio side

Extend `CustomAudioNode`. The base class already provides:

- `this.in`: the node itself, a `GainNode`. Map it as `input` and connect it to your
  processing.
- `this.out`: a `GainNode`. Connect your processing into it and map it as `output`.
- `this.own(node)`: registers an inner node so `dispose()` tears it down, and returns the node.
- `this.createWorklet(name, url, options?)`: creates an `AudioWorkletNode` that is already owned
  (see below).
- `dispose()`: disconnects `this` and every owned node, stops owned sources, and tells owned
  worklets to stop.

### The rules

- **Pass every inner node you create to `this.own(...)`.** That includes oscillators, constant
  sources, filters, gains and analysers. Deleting a module only calls `dispose()`. An unowned
  source or worklet keeps running on the audio thread for the rest of the session.
- **Override `dispose()` (and call `super.dispose()`) for anything outside the audio graph.**
  That means animation frames, timers, DOM or MIDI listeners. See `display.ts` and
  `midi/base.ts`.
- **Use a started `ConstantSourceNode` to drive a value.** A `GainNode` with nothing connected
  outputs silence whatever its `gain` is. Map the source's `offset` as the param.
- **`this.connect(x)` connects the *input*.** The base class copies `this.out.connect`
  onto `this` without binding it, so the call still runs on `this` (`this.in`). `gain.ts`
  and `display.ts` rely on this to wire `in → out` and `in → analyser`. To feed the outlet,
  connect into `this.out` explicitly. The reconciler wires edges from the object mapped as
  `output`, so that is what other modules hear.

## Example: a module without a worklet

A stereo panner, `nodes/pan.ts`:

```ts
import { CustomAudioNode } from "../custom";
import { Node } from "../node";

export const pan: Node = {
  category: 'Processors',
  params: () => [
    { name: 'input', type: 'input', dataType: 'signal' },
    { name: 'position', type: 'input', dataType: 'number', value: 0, min: -1, max: 1 },
    { name: 'output', type: 'output', dataType: 'signal' },
  ],

  build: actx => new Pan(actx)
}

class Pan extends CustomAudioNode {
  constructor(actx: AudioContext) {
    super(actx)

    const p = this.own(new StereoPannerNode(actx))
    this.in.connect(p)
    p.connect(this.out)

    this.params = {
      input: this.in,
      position: p.pan,
      output: this.out,
    }
  }
}
```

Example of a string param, adapted from `oscillator.ts`:

```ts
shape: {
  get value() { return o.type },
  set value(v: OscillatorType) { o.type = v }
},
```

## Example: a module with an audio worklet

Use a worklet when no built-in Web Audio node does the job, e.g. for per-sample logic like
`clock`, `samphold` or `quantizer`. A worklet module is a folder with two files:

```
nodes/fold/
  index.ts             the Node + CustomAudioNode (main thread)
  fold_processor.ts    the AudioWorkletProcessor (audio thread)
```

### The processor: `nodes/fold/fold_processor.ts`

```ts
import { DisposableProcessor } from "../../processor"

export class FoldProcessor extends DisposableProcessor {

  static get parameterDescriptors() {
    return [
      {
        // driven by a connected ConstantSourceNode: must default to 0 (see below)
        name: 'amount',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate'
      }
    ]
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0]
    const output = outputs[0]
    const amount = 1 + parameters.amount[0]

    for (let chn = 0; chn < output.length; chn++) {
      const inChannel = input?.[chn]
      const outChannel = output[chn]
      for (let sample = 0; sample < outChannel.length; sample++) {
        outChannel[sample] = Math.sin((inChannel?.[sample] ?? 0) * amount)
      }
    }

    return this.alive
  }
}

registerProcessor('fold-processor', FoldProcessor)
```

### The node: `nodes/fold/index.ts`

```ts
import { CustomAudioNode } from "../../custom";
import { Node } from "../../node";
import FoldProcessorUrl from './fold_processor?worker&url';

export const fold: Node = {
  category: 'Processors',
  params: () => [
    { name: 'input', type: 'input', dataType: 'signal' },
    { name: 'amount', type: 'input', dataType: 'number', value: 1, min: 0 },
    { name: 'output', type: 'output', dataType: 'signal' },
  ],

  build: actx => new Fold(actx)
}

class Fold extends CustomAudioNode {

  private amount: ConstantSourceNode

  constructor(actx: AudioContext) {
    super(actx)

    this.amount = this.own(actx.createConstantSource())
    this.amount.start()

    this.createWorklet('fold-processor', FoldProcessorUrl)
    .then(n => {
      this.in.connect(n)
      this.amount.connect(n.parameters.get('amount')!)
      n.connect(this.out)
    })

    this.params = {
      input: this.in,
      amount: this.amount.offset,
      output: this.out,
    }
  }
}
```

### Worklet rules

- **Import the processor as `./x_processor?worker&url`.** Vite then bundles it as a separate
  file, including what it imports such as `DisposableProcessor`. Pass that URL to
  `createWorklet`. The worklet module is loaded the first time one of these nodes is created.
- **The name given to `registerProcessor` must match the name passed to `createWorklet`.**
- **Extend `DisposableProcessor` and `return this.alive` from `process()`.** If `process()`
  returns `true` forever, the browser can never stop the node. `dispose()` posts
  `{ dispose: true }`, which sets `alive` to `false`.
- **Set `defaultValue: 0` on every parameter descriptor driven by a connected source.**
  Signals connected to an `AudioParam` are *added* to its own value, so a non-zero default
  would be counted twice. The real default goes only in `params()`'s `value`, which the
  reconciler writes into the `ConstantSourceNode`.
- **Map params to the main-thread objects, never to the worklet's own.** `this.params` is read
  synchronously right after `build()`, but the worklet only arrives later in `.then(...)`.
  Map the always-present `ConstantSourceNode.offset`, `this.in` and `this.out` instead.
- **`'a-rate'` or `'k-rate'`:** use `'a-rate'` (a 128-sample array) only if the value must
  change within a block, like `clock`'s `bpm`. Otherwise use `'k-rate'` and read `[0]`.
  For a-rate, handle both array lengths (`p.length > 1 ? p[i] : p[0]`), because the
  browser may pass a single element when the value is constant over the block.
- **More than one signal inlet:** pass `{ numberOfInputs: n }` and connect each inlet with
  `source.connect(worklet, 0, inputIndex)`. See `samphold`.
- **String params:** they can't be `AudioParam`s. Forward them with
  `worklet.port.postMessage(...)` and handle them by overriding `onMessage(data)` in the
  processor. Don't set `port.onmessage` yourself, because `DisposableProcessor` uses it. The
  worklet may not exist yet when the value is first set, so keep the value in a field and
  send it again once the worklet arrives. See `quantizer`.
- **Inputs can be missing.** `inputs[0]` is empty when nothing is connected, so use
  `input?.[chn]?.[sample] ?? 0`.
- **`process()` runs every 128 samples on the real-time thread.** Don't allocate memory, log,
  or do anything per sample that could be done once per block.

## 3. Register and document it

1. Add it to the `nodes` record in `nodes/index.ts`. The key is the module's name in the
   language (`pan`, `$pan`, …), the palette and autocomplete. Matching is fuzzy, so avoid names
   that collide with existing ones.
2. Pick the `category` the palette groups it under (`NodeCategory` in `node.ts`).
3. Add a row to the matching table in `docs/modules.md`.
