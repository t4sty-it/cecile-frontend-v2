import { test, expect } from 'bun:test'

import * as p from './Point'

const p0 = p.of(0, 0)
const p1 = p.of(1, 1)
const p2 = p.of(2, 2)

test('add', () => {
  expect(p.add(p0)).toEqual(p0)
  expect(p.add(p0, p0)).toEqual(p0)
  expect(p.add(p0, p1)).toEqual(p1)
  expect(p.add(p1, p0)).toEqual(p1)
  expect(p.add(p1, p1)).toEqual(p2)
  expect(p.add(p0, p1, p1)).toEqual(p2)
})

test('mul', () => {
  expect(p.mul(p0, 234)).toEqual(p0)
  expect(p.mul(p1, 2)).toEqual(p2)
})