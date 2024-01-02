export type Set<T> = Record<string, SetEntry<T>>

type SetEntry<T> = {id: string, value: T}
function entryOf<T>(obj: T, id: string): SetEntry<T> {
  return {
    id,
    value: obj
  }
} 

export function setOf<T>(objs: T[], id: (obj: T) => string): Set<T> {
  return Object.fromEntries(
    objs.map(obj => [
      id(obj),
      entryOf(obj, id(obj))
    ])
  )
}

export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  return {...a, ...b}
}

export function subtract<X, Y>(src: Set<X>, sub: Set<Y>): Set<X> {
  const kSub = Object.keys(sub)
  return Object.fromEntries(
    Object.entries(src)
      .filter(([k, _]) => !kSub.includes(k))
    )
}

export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const ab = union(a, b)
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  return Object.fromEntries(
    Object.entries(ab)
      .filter(([k, _]) => ka.includes(k) && kb.includes(k))
    )
}

export function valuesOf<T>(set: Set<T>): T[] {
  return Object.values(set).map(entry => entry.value)
}

export function valueOf<T>(set: Set<T>, id: string): T | null {
  return set[id]?.value
}

export function outerJoin<X, Y>(a: Set<X>, b: Set<Y>): Set<[X|null, Y|null]> {
  const ka = Object.keys(a)
  const kb = Object.keys(b)

  const setEntries = [
    ...ka.map(k => entryOf<[X|null, Y|null]>([
      valueOf(a, k),
      valueOf(b, k)
    ], k)),

    ...kb.map(k => entryOf<[X|null, Y|null]>([
      valueOf(a, k),
      valueOf(b, k)
    ], k))
  ]

  return Object.fromEntries(
    setEntries.map(e => [e.id, e])
  )
}

export function innerJoin<X, Y>(a: Set<X>, b: Set<Y>): Set<[X, Y]> {
  return Object.fromEntries(
    Object.entries(outerJoin(a, b))
      .filter(([_, {value}]) => value[0] != null && value[1] != null)
      .map(e => e as [String, SetEntry<[X, Y]>])
  )
}

export function select<X, Y>(a: Set<X>, b: Set<Y>): Set<X> {
  const kb = Object.keys(b)
  return Object.fromEntries(
    Object.entries(a)
      .filter(([k, _]) => kb.includes(k))
  )
}

export function map<T>(set: Set<T>, mapFunction: (item: T, idx: number, items: T[]) => T) {
  const setValues = valuesOf(set)
  return Object.fromEntries(
    Object.entries(set)
      .map(([id, entryValue], idx) =>
        [id, mapFunction(entryValue.value, idx, setValues)])
  )
}

export function filter<T>(
  set: Set<T>,
  filterFunction: (item: T, idx: number, items: T[]) => boolean
) {
  const setValues = valuesOf(set)
  return Object.fromEntries(
    Object.entries(set)
      .filter(([_, entryValue], idx) =>
        filterFunction(entryValue.value, idx, setValues))
  )
}

export function length<T>(set: Set<T>): number {
  return Object.entries(set).length
}