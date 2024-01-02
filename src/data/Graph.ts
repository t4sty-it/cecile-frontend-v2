import { Edge } from "./Edge"
import { Node } from "./Node"
import { Param } from "./Param"
import { Point } from "./Point"

export class Graph {
  constructor(
    public nodes: Node[],
    public params: Param[],
    public edges: Edge[]){
      this.nodeCache = Object.fromEntries(
        nodes.map(n => [n.id, n])
      )
    }
  
  private nodeCache: Record<string, Node> = {}
  
  public parentNode(param: Param) {
    return this.nodeCache[param.parentId]
  }

  public inputParams(node: Node): Param[] {
    return this.params.filter(p =>
      this.parentNode(p).id === node.id &&
      p.type === 'input'
    ) ?? []
  }
  
  public outputParams(node: Node): Param[] {
    return this.params.filter(p =>
      this.parentNode(p).id === node.id &&
      p.type === 'output'
    ) ?? []
  }

  public paramOffsetPosition(param: Param): Point {
    return {
      x: this.parentNode(param).position.x + param.offset.x,
      y: this.parentNode(param).position.y + param.offset.y,
    }
  }

  public edgeSrcPos(edge: Edge): Point
   {
    return {
      x: this.parentNode(edge.src).position.x + edge.src.offset.x,
      y: this.parentNode(edge.src).position.y + edge.src.offset.y,
    }
  }
  
  public edgeDstPos(edge: Edge): Point {
    return {
      x: this.parentNode(edge.dst).position.x + edge.dst.offset.x,
      y: this.parentNode(edge.dst).position.y + edge.dst.offset.y,
    }
  }
}


