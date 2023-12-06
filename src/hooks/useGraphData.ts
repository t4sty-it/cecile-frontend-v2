import { Edge } from "@/data/Edge";
import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { Point } from "@/data/Point";
import { useState } from "react";

const mockNodes: Node[] = [
  {
    id: 'n01',
    name: 'N01',
    position: {x: 100, y: 100},
  },

  {
    id: 'n02',
    name: 'N02',
    position: {x: 200, y: 200},
  },
]

const mockParams: Param[] = [
  {
    id: 'n01-out',
    name: 'OUT',
    type: 'output',
    dataType: 'number',
    parentId: mockNodes[0].id,
    offset: {x: 300, y: 50}
  },
  {
    id: 'n02-in',
    name: 'IN',
    type: 'input',
    dataType: 'number',
    parentId: mockNodes[1].id,
    offset: {x: 0, y: 50}
  },
]

const mockEdges: Edge[] = [
  {
    src: mockParams[0],
    dst: mockParams[1],
  },
]

export function useGraphData() {

  const [nodes, setNodes] = useState<Node[]>(mockNodes)
  const [params, setParams] = useState<Param[]>(mockParams)
  const [edges, setEdges] = useState<Edge[]>(mockEdges)

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
    setParams(p => [...p, ...params])
  }

  return {
    nodes, params, edges,
    toggleConnection, moveNode,
    addNode
  }
}