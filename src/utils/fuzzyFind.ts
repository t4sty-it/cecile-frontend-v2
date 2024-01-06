export function fuzzyFind(key: string, pool: string[]): string[] {
  return fuzzyFilter(key, pool, x => x)
}

export function reverseFuzzyFind(partials: string[], target: string): string | undefined {
  return partials.find(partial => fuzzyFind(partial, [target]).length == 1)
}

export function reverseFuzzyFilter<T>(partials: T[], target: string, prop: (item: T) => string): T | undefined {
  return partials.find(partial => fuzzyFind(prop(partial), [target]).length == 1)
}


export function fuzzyFilter<T>(key: string, pool: T[], prop: (item: T) => string): T[] {
  const startRegExp = new RegExp(`^${key}.+$`)
  const infraRegExp = new RegExp('^' + key.split('').join('.*') + '$')
  const fuzzyRegExp = new RegExp(key.split('').join('.*'))

  return [
    ...pool.filter(item => key == item),
    ...pool.filter(item => prop(item).match(startRegExp) && key != item),
    ...pool.filter(item => prop(item).match(infraRegExp) && !prop(item).match(startRegExp) && key != item),
    ...pool.filter(item => prop(item).match(fuzzyRegExp) && !prop(item).match(infraRegExp) && !prop(item).match(startRegExp) && key != item),
  ]
}