# Modules

These are all the modules you can create in Cécile. Every name can be abbreviated when you
type it in the console (`osc` for `oscillator`, `sh` for `samphold`, …). See the
[language reference](language.md) for how to create and connect them.

Unless noted otherwise, a module reads its signal from an inlet called `input` and sends it
out of an outlet called `output`. Those are the ones a connector uses by default.

## Sources

| Module | Description |
|--------|-------------|
| `oscillator` | Periodic waveform (`sine`, `triangle`, `square`, `sawtooth`) with modulatable `frequency` and output `gain`. |
| `noise` | White noise. |
| `constant` | Outputs a constant `value`. Useful as a control signal. |
| `clock` | Pulse train at a given `bpm` and `pulseWidth`. |

## Processing

| Module | Description |
|--------|-------------|
| `filter` | Biquad filter (`lowpass`, `highpass`, `bandpass`, `lowshelf`, `highshelf`, `peaking`, `notch`, `allpass`) with `frequency`, `q`, `gain` and `detune`. |
| `gain` | Amplifier / VCA. Its `gain` can be modulated by a signal. |
| `delay` | Delay line with modulatable `time`. |
| `ahr` | Slew / envelope follower. Rises towards the input at the `attack` rate, falls at the `release` rate, and stays within 0–1. Feed it a gate to get an envelope. |
| `clip` | Clamps the signal between `min` and `max`. |
| `samphold` | Sample & hold. Captures the input on each rising edge of `trigger` that crosses `threshold`. |
| `quantizer` | Snaps a signal (in semitones) to the nearest note of a `scale` (`major`, `minor harmonic`, `pentatonic`), after adding `offset`. |
| `mtof` | Converts MIDI note numbers to frequency in Hz. |

## Outputs

| Module | Description |
|--------|-------------|
| `out` | Sends the signal to your speakers. |
| `display` | Logs its input value to the browser console under a `label`. Handy for debugging control signals. |

## MIDI input

All MIDI modules have a `device` and a `channel` param. Leave either empty to accept any device
or channel. MIDI modules have no outlet called `output`, so name the one you want when you
connect them, e.g. `midi-keyboard-in }frequency > frequency{ osc`.

The easiest way to create one is [MIDI learn](../README.md#midi-learn): press <kbd>m</kbd> and
move a control on your device.

| Module | Outputs |
|--------|---------|
| `midi-note-in` | `frequency` and `velocity` of the last note received. |
| `midi-keyboard-in` | Like `midi-note-in`, but keeps track of held notes (last-note priority) and applies pitch bend (`pitchRange` in semitones). |
| `midi-cc-in` | `value` of a control change (filter by `cc` number). |
| `midi-pitch-in` | Pitch-bend `pitch`. |
| `midi-aftertouch-in` | Channel aftertouch `pressure`. |
| `midi-poly-aftertouch-in` | Polyphonic aftertouch `note` and `pressure`. |
| `midi-pc-in` | Program change `program`. |
| `midi-sys-message-in` | Status byte of system messages. |
