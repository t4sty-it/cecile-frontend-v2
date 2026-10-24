import { Edge } from "@/data/Edge";
import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { add, Point } from "@/data/Point";
import { graphOf, union, valuesOf } from "@/lib/graph";
import { Definitions, execProgram } from "@/lib/lang";
import { useEffect, useState } from "react";
import { nodes as nodeConstructors } from '@/lib/commands/node/nodes'
import { buildNode } from "@/lib/commands/node";
import { useMousePosition } from "./useMousePosition";
import { descendantIds, GraphData, GROUP_NODE_NAME, groupNodes, PortBuilder, ungroupNode, viewOf } from "@/lib/group";

const newId = () => '' + Math.random()

export function useGraphData() {

  const [nodes, setNodes] = useState<Node[]>([])
  const [params, setParams] = useState<Param[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [error, setError] = useState<string | null>(null)
  // group templates defined from the console, global to the patch
  const [definitions, setDefinitions] = useState<Definitions>({})

  useEffect(() => {
    if (error === null) return
    const timeout = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timeout)
  }, [error])

  const mousePosition = useMousePosition()

  // the canvas may hand over group pins, i.e. port params re-parented to the group
  const toggleConnection = (srcPin: Param, dstPin: Param) => {
    const src = params.find(p => p.id == srcPin.id)
    const dst = params.find(p => p.id == dstPin.id)
    if (src == null || dst == null) return

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
    setNodes(nodes => {
      const moved = descendantIds(nodes, ids)
      return nodes.map(node =>
        moved.includes(node.id)
          ? {...node, position: add(node.position, delta)}
          : node
      )
    })
  }

  const setGraph = (graph: GraphData) => {
    setNodes(graph.nodes)
    setParams(graph.params)
    setEdges(graph.edges)
  }

  const buildPort: PortBuilder = (type, position, parentId) => {
    const [node, ports] = buildNode(type, { nodeOverrides: { name: type, position, parentId } })
    return [node, ports.map(_fixParamOffset)]
  }

  const group = (ids: string[], parentId: string | undefined): string => {
    const groupId = newId()
    setGraph(groupNodes({ nodes, params, edges }, ids, parentId, groupId, buildPort))
    return groupId
  }

  const ungroup = (groupIds: string[]) => {
    setGraph(groupIds.reduce(ungroupNode, { nodes, params, edges }))
  }

  const addNode = (node: Node, params: Param[]) => {
    setNodes(nodes => [...nodes, node])
    const paramsWithFixedOffset = params.map(_fixParamOffset)
    setParams(p => [...p, ...paramsWithFixedOffset])
  }

  const removeNode = (id: string) => {
    const removed = descendantIds(nodes, [id])
    setNodes(nodes => nodes.filter(node => !removed.includes(node.id)))
    setParams(params => params.filter(param => !removed.includes(param.parentId)))
    setEdges(edges => edges.filter(edge =>
      !removed.includes(edge.src.parentId) && !removed.includes(edge.dst.parentId)))
  }

  const updateParam = (id: string, value: string | number | File) => {
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

  const execCommand = (cmd: string, parentId?: string): boolean => {

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
                position: mousePosition,
                parentId,
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
    
    const langGraphOf = (graph: GraphData) => graphOf<Node, Param>(
      graph.nodes,
      graph.params,
      graph.edges.map(e => ({id: `${e.src.id}:${e.dst.id}`, src: e.src.id, dst: e.dst.id }))
    )
    const srcGraph = langGraphOf({ nodes, params, edges })
    // selectors only see the current level; the diff never contains selected
    // nodes, so the pins they expose don't leak into the graph
    const levelGraph = langGraphOf(viewOf(nodes, params, edges, parentId))

    const buildGroup = (): Node => ({
      id: newId(),
      name: GROUP_NODE_NAME,
      group: true,
      position: mousePosition,
      parentId,
    })

    try {
      const { diff, definitions: newDefinitions } = execProgram(
        cmd, levelGraph, nodeBuilders, mousePosition,
        {}, // TODO pass the actual metaCommands
        { definitions, buildGroup },
      )
      const [newNodes, newParams, newEdges] = valuesOf(union(srcGraph, diff))
      setDefinitions(newDefinitions)
      setGraph({
        nodes: newNodes,
        params: newParams,
        edges: newEdges.map(e => ({
          src: newParams.find(p => p.id == e.src)!,
          dst: newParams.find(p => p.id == e.dst)!
        })),
      })
      setError(null)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  const clearError = () => setError(null)

  return {
    nodes, params, edges, error, definitions,
    toggleConnection, moveNode, moveNodes,
    addNode, removeNode, updateParam,
    group, ungroup,
    execCommand, clearError,
  }
}