import { Node } from "./Node"
import { Point } from "./Point"

export interface Param {
  id: string
  name: string
  type: 'input' | 'output'
  dataType: 'number' | 'string'
  parent: Node
  offset: Point
}