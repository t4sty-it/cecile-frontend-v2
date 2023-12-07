import { Edge } from "@/data/Edge";
import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { Point } from "@/data/Point";
import { useState } from "react";

export function useGraphData() {

  const [nodes, setNodes] = useState<Node[]>([])
  const [params, setParams] = useState<Param[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const toggleConnection = (src: Param, dst: Param) => {
    const edgeIdx = edges.findIndex(e => 
      e.src.id == src.id &&
      e.dst.id == dst.id
    )

    if (edgeIdx >= 0)
      setEdges(edges => edges.toSpliced(edgeIdx, 1))
    else
      setEdges(edges => [...edges, {src, dst}])
  }

  const moveNode = (target: Node, point: Point) => {
    setNodes(nodes =>
      nodes.map(node =>
        node.id === target.id
          ? {...target, position: point}
          : node))
  }

  const addNode = (node: Node, params: Param[]) => {
    setNodes(nodes => [...nodes, node])
    const paramsWithFixedOffset = params.map(_fixParamOffset)
    setParams(p => [...p, ...paramsWithFixedOffset])
  }

  const _fixParamOffset = (param: Param, idx: number) => ({
    ...param,
    offset: {
      x: param.type == 'input' ? 0 : 300,
      y: 8 + (idx + 1) * 25 + 25/2
    }
  }) as Param

  return {
    nodes, params, edges,
    toggleConnection, moveNode,
    addNode
  }
}