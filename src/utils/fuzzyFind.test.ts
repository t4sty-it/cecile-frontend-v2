import {test, expect} from 'bun:test'
import { fuzzyFilter, fuzzyFind } from './fuzzyFind'

test('fuzzyFind', () => {
  expect(fuzzyFind('x', [])).toEqual([])
  expect(fuzzyFind('x', ['x'])).toEqual(['x'])
  expect(fuzzyFind('x', ['1x'])).toEqual(['1x'])
  expect(fuzzyFind('x', ['1x', 'x'])).toEqual(['x', '1x'])
})

test('fuzzyFilter', () => {
  const a = (i: {a: string}) => i.a
  expect(fuzzyFilter('x', [], a)).toEqual([])
  expect(fuzzyFilter('x', [{a: 'x'}], a)).toEqual([{a: 'x'}])
  expect(fuzzyFilter('x', [{a: '1x'}], a)).toEqual([{a: '1x'}])
  expect(fuzzyFilter('x', [{a: '1x'}, {a: 'x'}], a)).toEqual([{a: 'x'}, {a: '1x'}])
})