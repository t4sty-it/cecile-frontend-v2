import { Edge } from "./Edge"
import { Node } from "./Node"
import { Param } from "./Param"
import { Point } from "./Point"

export class Graph {
  constructor(
    public nodes: Node[],
    public params: Param[],
    public edges: Edge[]){}
  
  public inputParams(node: Node): Param[] {
    return this.params.filter(p =>
        p.parent.id === node.id && p.type === 'input') ?? []
  }
  
  public outputParams(node: Node): Param[] {
    return this.params.filter(p =>
        p.parent.id === node.id && p.type === 'output') ?? []
  }

  public edgeSrcPos(edge: Edge): Point {
    return {
      x: edge.src.parent.position.x + edge.src.offset.x,
      y: edge.src.parent.position.y + edge.src.offset.y,
    }
  }
  
  public edgeDstPos(edge: Edge): Point {
    return {
      x: edge.dst.parent.position.x + edge.dst.offset.x,
      y: edge.dst.parent.position.y + edge.dst.offset.y,
    }
  }
}


