import { describe, expect, test } from "bun:test"
import { midiLearnResult } from "./learn"

describe("midiLearnResult", () => {
  test("maps a note message to midi-keyboard-in", () => {
    expect(midiLearnResult('Keyboard', { type: 'noteon', channel: 0, note: 60, velocity: 100 }))
      .toEqual({ nodeType: 'midi-keyboard-in', paramOverrides: { device: 'Keyboard', channel: '0' } })
  })

  test("maps a cc message to midi-cc-in with the cc number preset", () => {
    expect(midiLearnResult('Knobs', { type: 'cc', channel: 2, controller: 74, value: 30 }))
      .toEqual({ nodeType: 'midi-cc-in', paramOverrides: { device: 'Knobs', channel: '2', cc: '74' } })
  })

  test("maps a program change to midi-pc-in", () => {
    expect(midiLearnResult('Rack', { type: 'programchange', channel: 0, program: 5 }))
      .toEqual({ nodeType: 'midi-pc-in', paramOverrides: { device: 'Rack', channel: '0' } })
  })

  test("maps pitch bend to midi-pitch-in", () => {
    expect(midiLearnResult('Wheel', { type: 'pitchbend', channel: 0, value: 8192 }))
      .toEqual({ nodeType: 'midi-pitch-in', paramOverrides: { device: 'Wheel', channel: '0' } })
  })

  test("maps channel pressure to midi-aftertouch-in", () => {
    expect(midiLearnResult('Pad', { type: 'channelpressure', channel: 0, pressure: 90 }))
      .toEqual({ nodeType: 'midi-aftertouch-in', paramOverrides: { device: 'Pad', channel: '0' } })
  })

  test("maps polyphonic pressure to midi-poly-aftertouch-in", () => {
    expect(midiLearnResult('Pad', { type: 'polypressure', channel: 0, note: 60, pressure: 90 }))
      .toEqual({ nodeType: 'midi-poly-aftertouch-in', paramOverrides: { device: 'Pad', channel: '0' } })
  })

  test("maps a system message to midi-sys-message-in without a channel", () => {
    expect(midiLearnResult('Clock', { type: 'system', status: 0xF8 }))
      .toEqual({ nodeType: 'midi-sys-message-in', paramOverrides: { device: 'Clock' } })
  })
})
