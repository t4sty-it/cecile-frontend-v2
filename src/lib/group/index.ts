import { Edge } from "@/data/Edge"
import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { add, Point } from "@/data/Point"

export const GROUP_NODE_NAME = 'group'

export type PortType = 'inlet' | 'outlet'
export type GraphData = { nodes: Node[], params: Param[], edges: Edge[] }
export type PortBuilder = (type: PortType, position: Point, parentId: string) => [Node, Param[]]

export const isGroup = (node: Node) => node.group === true
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

const outerParamName = (port: Node) => port.name === 'inlet' ? 'input' : 'output'

// the node standing for a param at the level it is wired on: a port's outer
// side (inlet input, outlet output) is wired from outside, as a pin of its group
function anchorOf(byId: Map<string, Node>) {
  return (param: Param): Node => {
    const owner = byId.get(param.parentId)!
    return isPort(owner) && owner.parentId != null && param.name === outerParamName(owner)
      ? byId.get(owner.parentId)!
      : owner
  }
}

function isWithin(byId: Map<string, Node>, node: Node, groupId: string | undefined) {
  if (groupId == null) return true
  for (let id = node.parentId; id != null; id = byId.get(id)?.parentId)
    if (id === groupId) return true
  return false
}

// edges crossing group boundaries are rerouted through ports, one boundary at
// a time: one inlet per distinct outer source, one outlet per distinct outer
// destination
export function normalize(graph: GraphData, buildPort: PortBuilder): GraphData {
  let { nodes, params, edges } = graph

  for (;;) {
    const byId = new Map(nodes.map(n => [n.id, n]))
    const anchor = anchorOf(byId)
    const crossing = edges.find(e => anchor(e.src).parentId !== anchor(e.dst).parentId)
    if (crossing == null) return { nodes, params, edges }

    const srcAnchor = anchor(crossing.src)
    const exiting = !isWithin(byId, anchor(crossing.dst), srcAnchor.parentId)
    const type: PortType = exiting ? 'outlet' : 'inlet'
    const groupId = (exiting ? srcAnchor.parentId : anchor(crossing.dst).parentId)!

    const ports = nodes.filter(n => n.parentId === groupId && n.name === type)
    let port = ports.find(p => edges.some(e => exiting
      ? e.src.parentId === p.id && e.dst.id === crossing.dst.id
      : e.dst.parentId === p.id && e.src.id === crossing.src.id))

    if (port == null) {
      const [created, createdParams] = buildPort(type, portPosition(nodes, groupId, type, ports.length), groupId)
      port = created
      nodes = [...nodes, created]
      params = [...params, ...createdParams]
    }

    const rerouted: Edge[] = [
      { src: crossing.src, dst: portParam(params, port, 'input') },
      { src: portParam(params, port, 'output'), dst: crossing.dst },
    ]
    const key = (e: Edge) => `${e.src.id}:${e.dst.id}`
    const rest = edges.filter(e => e !== crossing)
    const existing = new Set(rest.map(key))
    edges = [...rest, ...rerouted.filter(e => !existing.has(key(e)))]
  }
}

function portPosition(nodes: Node[], groupId: string, type: PortType, idx: number): Point {
  const children = nodes.filter(n => n.parentId === groupId && !isPort(n))
  const xs = children.map(n => n.position.x)
  const ys = children.map(n => n.position.y)
  return {
    x: type === 'inlet' ? Math.min(...xs) - PORT_MARGIN : Math.max(...xs) + PORT_MARGIN,
    y: Math.min(...ys) + idx * PORT_SPACING,
  }
}

const centroid = (nodes: Node[]): Point => ({
  x: nodes.reduce((acc, n) => acc + n.position.x, 0) / nodes.length,
  y: nodes.reduce((acc, n) => acc + n.position.y, 0) / nodes.length,
})

export function groupNodes(
  graph: GraphData,
  ids: string[],
  parentId: string | undefined,
  groupId: string,
  buildPort: PortBuilder,
): GraphData {
  const members = graph.nodes.filter(n => ids.includes(n.id) && n.parentId === parentId)
  if (members.length === 0) return graph

  const group: Node = {
    id: groupId,
    name: GROUP_NODE_NAME,
    group: true,
    position: centroid(members),
    parentId,
  }
  const memberIds = members.map(n => n.id)

  return normalize({
    ...graph,
    nodes: [
      ...graph.nodes.map(n => memberIds.includes(n.id) ? { ...n, parentId: groupId } : n),
      group,
    ],
  }, buildPort)
}

// ports are spliced out: every source feeding a port is wired to every
// destination it fed. children keep their layout, centered on the group
export function ungroupNode(graph: GraphData, groupId: string): GraphData {
  const group = graph.nodes.find(n => n.id === groupId)
  if (group == null || !isGroup(group)) return graph

  const ports = graph.nodes.filter(n => n.parentId === groupId && isPort(n))
  const portIds = ports.map(p => p.id)
  const children = graph.nodes.filter(n => n.parentId === groupId && !isPort(n))
  const center = centroid(children)
  const shift = { x: group.position.x - center.x, y: group.position.y - center.y }

  const spliced = ports.flatMap(port => {
    const srcs = graph.edges.filter(e => e.dst.parentId === port.id).map(e => e.src)
    const dsts = graph.edges.filter(e => e.src.parentId === port.id).map(e => e.dst)
    return srcs.flatMap(src => dsts.map(dst => ({ src, dst })))
  })
  const kept = graph.edges.filter(e => !portIds.includes(e.src.parentId) && !portIds.includes(e.dst.parentId))
  const key = (e: Edge) => `${e.src.id}:${e.dst.id}`
  const seen = new Set(kept.map(key))

  return {
    nodes: graph.nodes
      .filter(n => n.id !== groupId && !portIds.includes(n.id))
      .map(n => n.parentId === groupId
        ? { ...n, parentId: group.parentId, position: add(n.position, shift) }
        : n),
    params: graph.params.filter(p => !portIds.includes(p.parentId)),
    edges: [
      ...kept,
      ...spliced.filter(e => !seen.has(key(e)) && seen.add(key(e))),
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

// a group's pins are the outer side of its ports, re-parented onto the group,
// ordered top to bottom and named after their labels
export function pinsOf(nodes: Node[], params: Param[], group: Node): Param[] {
  const ports = nodes
    .filter(n => n.parentId === group.id && isPort(n))
    .toSorted((a, b) => a.position.y - b.position.y)
  const pinsOfType = (type: PortType) => ports
    .filter(p => p.name === type)
    .map((port, idx) => {
      const param = portParam(params, port, outerParamName(port))
      return { ...param, parentId: group.id, name: port.label ?? pinName(param.type as 'input' | 'output', idx) }
    })
  return [...pinsOfType('inlet'), ...pinsOfType('outlet')]
    .map((p, idx) => ({ ...p, offset: pinOffset(p.type as 'input' | 'output', idx) }))
}

// expects a normalized graph
export function viewOf(
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  parentId: string | undefined,
): GraphData {

  const byId = new Map(nodes.map(n => [n.id, n]))
  const anchor = anchorOf(byId)
  const visibleNodes = nodes.filter(n => n.parentId === parentId)

  const pins = visibleNodes.filter(isGroup).flatMap(group => pinsOf(nodes, params, group))
  const pinById = new Map(pins.map(p => [p.id, p]))

  const atLevel = (p: Param) => anchor(p).parentId === parentId
  const asPin = (p: Param) => pinById.get(p.id) ?? p

  return {
    nodes: visibleNodes,
    params: [
      ...params.filter(p => byId.get(p.parentId)!.parentId === parentId && atLevel(p)),
      ...pins,
    ],
    edges: edges
      .filter(e => atLevel(e.src) && atLevel(e.dst))
      .map(e => ({ src: asPin(e.src), dst: asPin(e.dst) })),
  }
}
