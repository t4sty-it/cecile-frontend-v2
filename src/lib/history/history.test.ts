import { test, describe, expect } from 'bun:test'
import { init, navigate, present, push } from '.'

describe('history', () => {

  test('pushing causes entries to grow by 1', () => {
    let h = init(0)
    h = push(h, 1)
    expect(h.entries.length).toBe(2)
  })

  test('pushing causes present to be the pushed value', () => {
    let h = init(0)
    h = push(h, 1)
    expect(present(h)).toBe(1)
  })

  test('navigate 0 should keep everything as is', () => {
    const h1 = init(0)
    const h2 = navigate(h1, 0)
    expect(h2).toEqual(h1)
  })

  test('navigating should keep entries intact', () => {
    const h1 = push(push(init(0), 1), 2)
    const h2 = navigate(h1, 1)
    expect(h1.entries).toEqual(h2.entries)
  })

  test('navigating forward past the end should cause present to be the most recent entry', () => {
    const h1 = push(push(init(0), 1), 2)
    const h2 = navigate(h1, 100)
    expect(present(h2)).toBe(2)
  })

  test('navigating backward before the beginning should cause present to be the oldest entry', () => {
    const h1 = push(push(init(0), 1), 2)
    const h2 = navigate(h1, -100)
    expect(present(h2)).toBe(0)
  })
})
describe('push', () => {

  test('pushing the present value is a no-op', () => {
    const h1 = push(init(0), 1)
    const h2 = push(h1, 1)
    expect(h2).toBe(h1)
  })

  test('pushing after navigating back drops the redo entries', () => {
    const h1 = navigate(push(push(init(0), 1), 2), -1)
    const h2 = push(h1, 3)
    expect(h2.entries).toEqual([0, 1, 3])
  })
})
