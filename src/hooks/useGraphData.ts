import { Edge } from "@/data/Edge";
import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { add, Point } from "@/data/Point";
import { graphOf, union, valuesOf } from "@/lib/graph";
import { exec } from "@/lib/lang";
import { useState } from "react";
import { nodes as nodeConstructors } from '@/lib/commands/node/nodes'
import { buildNode } from "@/lib/commands/node";
import { useMousePosition } from "./useMousePosition";

export function useGraphData() {

  const [nodes, setNodes] = useState<Node[]>([])
  const [params, setParams] = useState<Param[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const mousePosition = useMousePosition()

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

  const moveNode = (id: string, point: Point) => {
    setNodes(nodes =>
      nodes.map(node =>
        node.id === id
          ? {...node, position: point}
          : node))
  }

  const moveNodes = (ids: string[], delta: Point) => {
    setNodes(nodes =>
      nodes.map(node =>
        ids.includes(node.id)
          ? {...node, position: add(node.position, delta)}
          : node 
      )
    )
  }

  const addNode = (node: Node, params: Param[]) => {
    setNodes(nodes => [...nodes, node])
    const paramsWithFixedOffset = params.map(_fixParamOffset)
    setParams(p => [...p, ...paramsWithFixedOffset])
  }

  const removeNode = (id: string) => {
    setNodes(nodes => nodes.filter(node => node.id != id))
    setParams(params => params.filter(param => param.parentId != id))
    setEdges(edges => edges.filter(edge => edge.src.parentId != id && edge.dst.parentId != id))
  }

  const updateParam = (id: string, value: string | number) => {
    setParams(params => params.map(param => param.id == id
      ? ({
        ...param,
        value
      })
      : param  
    ))
  }

  const _fixParamOffset = (param: Param, idx: number) => ({
    ...param,
    offset: {
      x: param.type == 'input' ? 0 : 220,
      y: 8 + (idx + 1) * 25 + 25/2
    }
  }) as Param

  const execCommand = (cmd: string) => {

    const nodeBuilders = Object.fromEntries(
      Object.keys(nodeConstructors)
        .map(name => [ 
          name,
          // build node; params will have zero offset...
          () => buildNode(
            name,
            {
              nodeOverrides: {
                name: name,
                position: mousePosition
              }
            }
          )
          // ...so we fix param offset "in post"
          .map((x, idx) => idx == 0
            ? (x as Node)
            : (x as Param[]).map(_fixParamOffset)
          ) as [Node, Param[]]
        ]
      )
    )
    
    const srcGraph = graphOf<Node, Param>(
      nodes,
      params,
      edges.map(e => ({id: `${e.src.id}:${e.dst.id}`, src: e.src.id, dst: e.dst.id }))
    )
    const diffGraph = exec(cmd, srcGraph, nodeBuilders, mousePosition, {})! // TODO remove when actually adding metaCommands
    const [newNodes, newParams, newEdges] = valuesOf(union(srcGraph, diffGraph))
    setNodes(newNodes)
    setParams(newParams)
    setEdges(newEdges.map(e => ({
      src: newParams.find(p => p.id == e.src)!,
      dst: newParams.find(p => p.id == e.dst)!
    })))
    
  }

  return {
    nodes, params, edges,
    toggleConnection, moveNode, moveNodes,
    addNode, removeNode, updateParam,
    execCommand,
  }
}