import { Edge } from "@/data/Edge"
import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { Point } from "@/data/Point"

export const GROUP_NODE_NAME = 'group'

export type PortType = 'inlet' | 'outlet'
export type ViewParam = Param & { virtual?: boolean }
export type GraphData = { nodes: Node[], params: Param[], edges: Edge[] }
export type PortBuilder = (type: PortType, position: Point, parentId: string) => [Node, Param[]]

export const isGroup = (node: Node) => node.name === GROUP_NODE_NAME
export const isPort = (node: Node) => node.name === 'inlet' || node.name === 'outlet'

const PORT_SPACING = 120
const PORT_MARGIN = 280

export function descendantIds(nodes: Node[], ids: string[]): string[] {
  const result = new Set(ids)
  let frontier = ids
  while (frontier.length > 0) {
    const children = nodes
      .filter(n => n.parentId != null && frontier.includes(n.parentId) && !result.has(n.id))
      .map(n => n.id)
    children.forEach(id => result.add(id))
    frontier = children
  }
  return [...result]
}

export function ancestry(nodes: Node[], id: string | undefined): Node[] {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const path: Node[] = []
  let cur = id != null ? byId.get(id) : undefined
  while (cur != null) {
    path.unshift(cur)
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined
  }
  return path
}

const portParam = (params: Param[], port: Node, name: 'input' | 'output') =>
  params.find(p => p.parentId === port.id && p.name === name)!

const groupBy = <T,>(items: T[], key: (t: T) => string) =>
  items.reduce((acc, item) => acc.set(key(item), [...(acc.get(key(item)) ?? []), item]), new Map<string, T[]>())

// boundary edges are rerouted through one inlet per distinct outer source
// and one outlet per distinct outer destination
export function groupNodes(
  graph: GraphData,
  ids: string[],
  parentId: string | undefined,
  groupId: string,
  buildPort: PortBuilder,
): GraphData {
  const members = graph.nodes.filter(n => ids.includes(n.id) && n.parentId === parentId)
  if (members.length === 0) return graph

  const xs = members.map(n => n.position.x)
  const ys = members.map(n => n.position.y)
  const group: Node = {
    id: groupId,
    name: GROUP_NODE_NAME,
    position: {
      x: xs.reduce((a, b) => a + b, 0) / members.length,
      y: ys.reduce((a, b) => a + b, 0) / members.length,
    },
    parentId,
  }

  const memberIds = members.map(n => n.id)
  const inside = new Set(descendantIds(graph.nodes, memberIds))
  const incoming = graph.edges.filter(e => !inside.has(e.src.parentId) && inside.has(e.dst.parentId))
  const outgoing = graph.edges.filter(e => inside.has(e.src.parentId) && !inside.has(e.dst.parentId))

  const newNodes: Node[] = []
  const newParams: Param[] = []
  const newEdges: Edge[] = []

  const addPorts = (type: PortType, edges: Edge[], x: number) => {
    const outerEnd = (e: Edge) => type === 'inlet' ? e.src.id : e.dst.id
    ;[...groupBy(edges, outerEnd).values()].forEach((sameOuterEnd, idx) => {
      const [port, params] = buildPort(type, { x, y: Math.min(...ys) + idx * PORT_SPACING }, groupId)
      const input = portParam(params, port, 'input')
      const output = portParam(params, port, 'output')
      newNodes.push(port)
      newParams.push(...params)
      if (type === 'inlet') {
        newEdges.push({ src: sameOuterEnd[0].src, dst: input })
        newEdges.push(...sameOuterEnd.map(e => ({ src: output, dst: e.dst })))
      } else {
        newEdges.push(...sameOuterEnd.map(e => ({ src: e.src, dst: input })))
        newEdges.push({ src: output, dst: sameOuterEnd[0].dst })
      }
    })
  }

  addPorts('inlet', incoming, Math.min(...xs) - PORT_MARGIN)
  addPorts('outlet', outgoing, Math.max(...xs) + PORT_MARGIN)

  const rerouted = new Set([...incoming, ...outgoing])

  return {
    nodes: [
      ...graph.nodes.map(n => memberIds.includes(n.id) ? { ...n, parentId: groupId } : n),
      group,
      ...newNodes,
    ],
    params: [...graph.params, ...newParams],
    edges: [...graph.edges.filter(e => !rerouted.has(e)), ...newEdges],
  }
}

// ports are spliced out: every source feeding a port is wired to every
// destination it fed
export function ungroupNode(graph: GraphData, groupId: string): GraphData {
  const group = graph.nodes.find(n => n.id === groupId)
  if (group == null || !isGroup(group)) return graph

  const ports = graph.nodes.filter(n => n.parentId === groupId && isPort(n))
  const portIds = ports.map(p => p.id)

  const spliced = ports.flatMap(port => {
    const srcs = graph.edges.filter(e => e.dst.parentId === port.id).map(e => e.src)
    const dsts = graph.edges.filter(e => e.src.parentId === port.id).map(e => e.dst)
    return srcs.flatMap(src => dsts.map(dst => ({ src, dst })))
  })
  const kept = graph.edges.filter(e => !portIds.includes(e.src.parentId) && !portIds.includes(e.dst.parentId))
  const edgeKey = (e: Edge) => `${e.src.id}:${e.dst.id}`
  const keptKeys = new Set(kept.map(edgeKey))

  return {
    nodes: graph.nodes
      .filter(n => n.id !== groupId && !portIds.includes(n.id))
      .map(n => n.parentId === groupId ? { ...n, parentId: group.parentId } : n),
    params: graph.params.filter(p => !portIds.includes(p.parentId)),
    edges: [
      ...kept,
      ...[...groupBy(spliced, edgeKey).values()]
        .map(([e]) => e)
        .filter(e => !keptKeys.has(edgeKey(e))),
    ],
  }
}

const pinOffset = (type: 'input' | 'output', idx: number): Point => ({
  x: type == 'input' ? 0 : 220,
  y: 8 + (idx + 1) * 25 + 25 / 2,
})

const pinName = (type: 'input' | 'output', idx: number) =>
  idx === 0
    ? type
    : `${type === 'input' ? 'i' : 'o'}${idx}`

// a group's pins are its inlets' inputs and outlets' outputs, ordered top to
// bottom; edges crossing its boundary elsewhere get a virtual pin per outer endpoint
export function viewOf(
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  parentId: string | undefined,
): { nodes: Node[], params: ViewParam[], edges: Edge[] } {

  const byId = new Map(nodes.map(n => [n.id, n]))
  const visibleNodes = nodes.filter(n => n.parentId === parentId)
  const visibleIds = visibleNodes.map(n => n.id)

  const visibleAncestor = (nodeId: string): string | undefined => {
    let cur = byId.get(nodeId)
    while (cur != null && cur.parentId !== parentId)
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined
    return cur?.id
  }

  const portPins = new Map<string, ViewParam>()
  visibleNodes.filter(isGroup).forEach(group => {
    const ports = nodes
      .filter(n => n.parentId === group.id && isPort(n))
      .toSorted((a, b) => a.position.y - b.position.y)
    for (const port of ports) {
      const type = port.name === 'inlet' ? 'input' : 'output'
      const param = portParam(params, port, type)
      portPins.set(param.id, { ...param, parentId: group.id, name: port.label ?? '' })
    }
  })

  const virtualPins = new Map<string, ViewParam>()
  const virtualPin = (groupId: string, type: 'input' | 'output', outerParamId: string): ViewParam => {
    const id = `${groupId}:${type}:${outerParamId}`
    const existing = virtualPins.get(id)
    if (existing) return existing
    const created: ViewParam = {
      id,
      parentId: groupId,
      name: '',
      type,
      dataType: 'signal',
      offset: { x: 0, y: 0 },
      virtual: true,
    }
    virtualPins.set(id, created)
    return created
  }

  const viewEdges = new Map<string, Edge>()
  for (const edge of edges) {
    const srcOwner = visibleAncestor(edge.src.parentId)
    const dstOwner = visibleAncestor(edge.dst.parentId)
    if (srcOwner == null || dstOwner == null || srcOwner === dstOwner) continue

    const src = srcOwner === edge.src.parentId
      ? edge.src
      : portPins.get(edge.src.id) ?? virtualPin(srcOwner, 'output', edge.dst.id)
    const dst = dstOwner === edge.dst.parentId
      ? edge.dst
      : portPins.get(edge.dst.id) ?? virtualPin(dstOwner, 'input', edge.src.id)
    viewEdges.set(`${src.id}:${dst.id}`, { src, dst })
  }

  const pins = visibleNodes.filter(isGroup).flatMap(group => {
    const all = [...portPins.values(), ...virtualPins.values()].filter(p => p.parentId === group.id)
    const inputs = all.filter(p => p.type === 'input')
    const outputs = all.filter(p => p.type === 'output')
    const named = (pins: ViewParam[]) => pins.map((p, idx) =>
      ({ ...p, name: p.name || pinName(p.type as 'input' | 'output', idx) }))
    return [...named(inputs), ...named(outputs)]
      .map((p, idx) => ({ ...p, offset: pinOffset(p.type as 'input' | 'output', idx) }))
  })
  const positioned = new Map(pins.map(p => [p.id, p]))

  return {
    nodes: visibleNodes,
    params: [
      ...params.filter(p => visibleIds.includes(p.parentId)),
      ...pins,
    ],
    edges: [...viewEdges.values()].map(e => ({
      src: positioned.get(e.src.id) ?? e.src,
      dst: positioned.get(e.dst.id) ?? e.dst,
    })),
  }
}
