export interface Point {
  x: number
  y: number
}

export function isPoint(p: Object): p is Point {
  return ['x', 'y'].every(k => 
    Object.keys(p).includes(k) &&
    typeof p[k as keyof typeof p] === 'number'
  )
}

export function of(p: [number, number]): Point
export function of(p: number, q: number): Point
export function of(p: [number, number] | number, q?: number): Point {
  const x: number = Array.isArray(p) ? p[0] : p
  const y: number | undefined = Array.isArray(p) ? p[1] : q

  if (y == undefined) throw 'Missing y component'
  return {x, y}
}

export function add(...p: Point[]): Point {
  return p.reduce(
    (acc, cur) => of(acc.x + cur.x, acc.y + cur.y),
    {x: 0, y:0}
  )
}

export function mul(p: Point, k: number): Point {
  return {
    x: p.x * k,
    y: p.y * k
  }
}