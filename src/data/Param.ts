import { Point, isPoint } from "./Point"

export interface Param {
  id: string
  name: string
  type: 'input' | 'output'
  dataType: 'number' | 'string'
  parentId: string
  offset: Point
}

function hasKeyOfType<T>(obj: Object, name: keyof T & string, type: string) {
  return Object.keys(obj).includes(name) &&
    typeof obj[name as keyof typeof obj] === type
}

export function isParam(p: Object): p is Param {
  return (
    hasKeyOfType<Param>(p, 'id', 'string') &&
    hasKeyOfType<Param>(p, 'name', 'string') &&
    hasKeyOfType<Param>(p, 'type', 'string') &&
    hasKeyOfType<Param>(p, 'dataType', 'string') &&
    hasKeyOfType<Param>(p, 'parentId', 'string') &&
    Object.keys(p).includes('offset') &&
    isPoint(p['offset' as keyof typeof p])
  )
}