import { Point, isPoint } from "./Point"

export interface Node {
  id: string
  name: string
  position: Point
}

export function isNode(n: Object): n is Node {

  const kk = Object.keys(n)

  return ['id', 'name'].every(k =>
    kk.includes(k) &&
    typeof (n[k as keyof typeof n]) === 'string'  
  ) &&
  kk.includes('position') && isPoint(n['position' as keyof typeof n])
}