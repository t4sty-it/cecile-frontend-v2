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