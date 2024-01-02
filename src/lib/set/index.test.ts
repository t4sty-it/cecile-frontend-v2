import { expect, test } from "bun:test";
import { intersect, setOf, subtract, union, valueOf, valuesOf, outerJoin, select } from ".";

// test('signedOf', () => {
//   expect(signedOf(3)).toEqual(3)
// })

const stringId = (x: number) => '' + x

test('setOf', () => {
  expect(valuesOf(setOf([1,2,3], stringId))).toEqual([1,2,3])
})

test('valueOf', () => {
  expect(valueOf(setOf([1,2,3], stringId), '2')).toBe(2)
})

test('union', () => {
  const s1 = setOf(
    [
      {id: '0', v: 0},
      {id: '1', v: 1},
      {id: '2', v: 2},
    ] as {id: string, v: number}[],

    i => i.id
  )

  const s2 = setOf(
    [
      {id: '2', v: 2},
      {id: '3', v: 3}
    ] as {id: string, v: number}[],

    i => i.id
  )

  const u = valuesOf(union(s1, s2))
  expect(u.length).toBe(4)
  expect(u[0].id).toBe('0')
  expect(u[3].id).toBe('3')
})

test('subtraction', () => {
  const s1 = setOf([1,2,3], stringId)
  const s2 = setOf([1,5,7], stringId)
  const s = subtract(s1, s2)

  expect(valuesOf(s).length).toBe(2)
  expect(valuesOf(s)).toEqual([2,3])
})

test('intersection', () => {
  const s1 = setOf([1,2,3], stringId)
  const s2 = setOf([2,3,4], stringId)

  const i = intersect(s1, s2)
  expect(valuesOf(i).length).toBe(2)
  expect(valuesOf(i)).toEqual([2,3])
})

test('join', () => {
  const s1 = setOf(
    [
      {id: '0', v: 0},
      {id: '1', v: 2},
      {id: '2', v: 4},
    ] as {id: string, v: number}[],

    i => i.id
  )

  const s2 = setOf(
    [
      {id: '0', w: 1},
      {id: '1', w: 3},
      {id: '2', w: 5},
    ] as {id: string, w: number}[],

    i => i.id
  )

  const z = outerJoin(s1, s2)

  expect(valuesOf(z).length).toBe(3)

  const z0 = valueOf(z, '0')!
  expect(z0).toBeDefined()
  expect(z0[0]?.v).toBeDefined()
  expect(z0[0]?.v).toBe(0)
  expect(z0[1]?.w).toBeDefined()
  expect(z0[1]?.w).toBe(1)
})

test('select', () => {
  const s1 = setOf(
    [
      {id: '0', v: 0},
      {id: '1', v: 2},
      {id: '2', v: 4},
    ] as {id: string, v: number}[],

    i => i.id
  )

  const s2 = setOf(
    [
      {id: '0', w: 1},
      {id: '100', w: 3},
      {id: '200', w: 5},
    ] as {id: string, w: number}[],

    i => i.id
  )

  const s = select(s1, s2)

  expect(valuesOf(s).length).toBe(1)
  expect(valueOf(s, '0')?.v).toBe(0)
})