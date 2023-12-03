export function fuzzyFind(key: string, pool: string[]): string[] {

  const startRegExp = new RegExp(`^${key}.+$`)
  const infraRegExp = new RegExp('^' + key.split('').join('.*') + '$')
  const fuzzyRegExp = new RegExp(key.split('').join('.*'))

  return [
    ...pool.filter(item => key == item),
    ...pool.filter(item => item.match(startRegExp) && key != item),
    ...pool.filter(item => item.match(infraRegExp) && !item.match(startRegExp) && key != item),
    ...pool.filter(item => item.match(fuzzyRegExp) && !item.match(infraRegExp) && !item.match(startRegExp) && key != item),
  ]
}