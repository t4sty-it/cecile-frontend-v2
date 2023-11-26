import { Param, isParam } from "./Param"

export interface Edge {
  src: Param
  dst: Param
}

export function isEdge(e: Object): e is Edge {
  const kk = Object.keys(e)
  return ['src', 'dst'].every(k => 
    kk.includes(k) &&
    isParam(e[k as keyof typeof e])
  )
}