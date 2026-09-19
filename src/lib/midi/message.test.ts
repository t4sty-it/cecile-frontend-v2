import { describe, expect, test } from "bun:test"
import { parseMidiMessage } from "./message"

describe("parseMidiMessage", () => {
  test("parses note on", () => {
    expect(parseMidiMessage([0x91, 64, 100])).toEqual({
      type: 'noteon', channel: 1, note: 64, velocity: 100
    })
  })

  test("parses note on with velocity 0 as note off", () => {
    expect(parseMidiMessage([0x90, 64, 0])).toEqual({
      type: 'noteoff', channel: 0, note: 64, velocity: 0
    })
  })

  test("parses note off", () => {
    expect(parseMidiMessage([0x85, 60, 40])).toEqual({
      type: 'noteoff', channel: 5, note: 60, velocity: 40
    })
  })

  test("parses polyphonic key pressure", () => {
    expect(parseMidiMessage([0xA2, 60, 90])).toEqual({
      type: 'polypressure', channel: 2, note: 60, pressure: 90
    })
  })

  test("parses control change", () => {
    expect(parseMidiMessage([0xB0, 1, 127])).toEqual({
      type: 'cc', channel: 0, controller: 1, value: 127
    })
  })

  test("parses program change", () => {
    expect(parseMidiMessage([0xCF, 12])).toEqual({
      type: 'programchange', channel: 15, program: 12
    })
  })

  test("parses channel pressure", () => {
    expect(parseMidiMessage([0xD3, 80])).toEqual({
      type: 'channelpressure', channel: 3, pressure: 80
    })
  })

  test("parses pitch bend as a combined 14-bit value", () => {
    expect(parseMidiMessage([0xE0, 0x00, 0x40])).toEqual({
      type: 'pitchbend', channel: 0, value: 8192
    })
  })

  test("parses system messages by status byte", () => {
    expect(parseMidiMessage([0xF8])).toEqual({ type: 'system', status: 0xF8 })
  })

  test("returns null for empty data", () => {
    expect(parseMidiMessage([])).toBeNull()
  })
})
