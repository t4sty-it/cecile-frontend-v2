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
import { useHistory } from "@/lib/history/useHistory";

const newId = () => '' + Math.random()

// everything undo/redo restores, kept in one value so an action is one step
type Snapshot = GraphData & { definitions: Definitions }

const emptySnapshot: Snapshot = { nodes: [], params: [], edges: [], definitions: {} }

export function useGraphData() {

  // `push` changes the graph without recording it, `commit` records it as an
  // undo step: gestures (drags, placement) push on every move and commit at the end
  const [snapshot, push, commit, navigate] = useHistory(emptySnapshot)
  // definitions are group templates defined from the console, global to the patch
  const { nodes, params, edges, definitions } = snapshot
  const [error, setError] = useState<string | null>(null)

  const change = (f: (s: Snapshot) => Snapshot) => {
    push(f)
    commit()
  }

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

    change(s => ({
      ...s,
      edges: edgeIdx >= 0
        ? s.edges.toSpliced(edgeIdx, 1)
        : [...s.edges, {src, dst}]
    }))
  }

  // moves are drafts: the caller commits when the gesture ends
  const moveNode = (id: string, point: Point) => {
    push(s => ({
      ...s,
      nodes: s.nodes.map(node =>
        node.id === id
          ? {...node, position: point}
          : node)
    }))
  }

  const moveNodes = (ids: string[], delta: Point) => {
    push(s => ({
      ...s,
      nodes: s.nodes.map(node =>
        ids.includes(node.id)
          ? {...node, position: add(node.position, delta)}
          : node
      )
    }))
  }

  const buildPort: PortBuilder = (type, position, parentId) => {
    const [node, ports] = buildNode(type, { nodeOverrides: { name: type, position, parentId } })
    return [node, ports.map(_fixParamOffset)]
  }

  const group = (ids: string[], parentId: string | undefined): string => {
    const groupId = newId()
    change(s => ({ ...s, ...groupNodes(s, ids, parentId, groupId, buildPort) }))
    return groupId
  }

  const ungroup = (groupIds: string[]) => {
    change(s => ({ ...s, ...groupIds.reduce(ungroupNode, s) }))
  }

  // `draft` leaves the step open, e.g. while the new node is being placed
  const addNode = (node: Node, params: Param[], { draft = false } = {}) => {
    const paramsWithFixedOffset = params.map(_fixParamOffset)
    const f = (s: Snapshot) => ({
      ...s,
      nodes: [...s.nodes, node],
      params: [...s.params, ...paramsWithFixedOffset],
    })
    if (draft) push(f)
    else change(f)
  }

  const removeNodes = (ids: string[]) => {
    change(s => {
      const removed = descendantIds(s.nodes, ids)
      return {
        ...s,
        nodes: s.nodes.filter(node => !removed.includes(node.id)),
        params: s.params.filter(param => !removed.includes(param.parentId)),
        edges: s.edges.filter(edge =>
          !removed.includes(edge.src.parentId) && !removed.includes(edge.dst.parentId)),
      }
    })
  }

  const updateParam = (id: string, value: string | number | File) => {
    change(s => ({
      ...s,
      params: s.params.map(param => param.id == id
        ? ({
          ...param,
          value
        })
        : param
      )
    }))
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
      change(() => ({
        nodes: newNodes,
        params: newParams,
        edges: newEdges.map(e => ({
          src: newParams.find(p => p.id == e.src)!,
          dst: newParams.find(p => p.id == e.dst)!
        })),
        definitions: newDefinitions,
      }))
      setError(null)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  const clearError = () => setError(null)

  // undo/redo return the restored snapshot, so callers can prune stale references
  const undo = () => navigate(-1)
  const redo = () => navigate(1)
  // drops uncommitted drafts, e.g. a cancelled placement
  const revert = () => navigate(0)

  return {
    nodes, params, edges, error, definitions,
    toggleConnection, moveNode, moveNodes,
    addNode, removeNodes, updateParam,
    group, ungroup,
    execCommand, clearError,
    commit, undo, redo, revert,
  }
}
