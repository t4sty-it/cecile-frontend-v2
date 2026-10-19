import { Edge } from "@/data/Edge"
import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { Point } from "@/data/Point"

export const GROUP_NODE_NAME = 'group'

export type ViewParam = Param & { virtual?: boolean }

export const isGroup = (node: Node) => node.name === GROUP_NODE_NAME

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

export function groupNodes(
  nodes: Node[],
  ids: string[],
  parentId: string | undefined,
  groupId: string,
): Node[] {
  const members = nodes.filter(n => ids.includes(n.id) && n.parentId === parentId)
  if (members.length === 0) return nodes

  const position: Point = {
    x: members.reduce((acc, n) => acc + n.position.x, 0) / members.length,
    y: members.reduce((acc, n) => acc + n.position.y, 0) / members.length,
  }
  const memberIds = members.map(n => n.id)
  const group: Node = { id: groupId, name: GROUP_NODE_NAME, position, parentId }

  return [
    ...nodes.map(n => memberIds.includes(n.id) ? { ...n, parentId: groupId } : n),
    group,
  ]
}

export function ungroupNode(nodes: Node[], groupId: string): Node[] {
  const group = nodes.find(n => n.id === groupId)
  if (group == null || !isGroup(group)) return nodes
  return nodes
    .filter(n => n.id !== groupId)
    .map(n => n.parentId === groupId ? { ...n, parentId: group.parentId } : n)
}

const pinOffset = (type: 'input' | 'output', idx: number): Point => ({
  x: type == 'input' ? 0 : 220,
  y: 8 + (idx + 1) * 25 + 25 / 2,
})

const pinName = (type: 'input' | 'output', idx: number) =>
  idx === 0
    ? type
    : `${type === 'input' ? 'i' : 'o'}${idx}`

// groups expose one virtual pin per distinct source param crossing their boundary
export function viewOf(
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  parentId: string | undefined,
): { nodes: Node[], params: ViewParam[], edges: Edge[] } {

  const byId = new Map(nodes.map(n => [n.id, n]))
  const visibleNodes = nodes.filter(n => n.parentId === parentId)

  const visibleAncestor = (nodeId: string): string | undefined => {
    let cur = byId.get(nodeId)
    while (cur != null && cur.parentId !== parentId)
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined
    return cur?.id
  }

  const pins = new Map<string, ViewParam>()
  const pinCount = new Map<string, number>()
  const pin = (groupId: string, type: 'input' | 'output', srcParamId: string): ViewParam => {
    const id = `${groupId}:${type}:${srcParamId}`
    const existing = pins.get(id)
    if (existing) return existing
    const countKey = `${groupId}:${type}`
    const idx = pinCount.get(countKey) ?? 0
    pinCount.set(countKey, idx + 1)
    const created: ViewParam = {
      id,
      parentId: groupId,
      name: pinName(type, idx),
      type,
      dataType: 'signal',
      offset: { x: 0, y: 0 },
      virtual: true,
    }
    pins.set(id, created)
    return created
  }

  const viewEdges = new Map<string, Edge>()
  for (const edge of edges) {
    const srcOwner = visibleAncestor(edge.src.parentId)
    const dstOwner = visibleAncestor(edge.dst.parentId)
    if (srcOwner == null || dstOwner == null || srcOwner === dstOwner) continue

    const src = srcOwner === edge.src.parentId ? edge.src : pin(srcOwner, 'output', edge.src.id)
    const dst = dstOwner === edge.dst.parentId ? edge.dst : pin(dstOwner, 'input', edge.src.id)
    viewEdges.set(`${src.id}:${dst.id}`, { src, dst })
  }

  const virtualParams = visibleNodes.flatMap(node => {
    const nodePins = [...pins.values()].filter(p => p.parentId === node.id)
    const ordered = [
      ...nodePins.filter(p => p.type === 'input'),
      ...nodePins.filter(p => p.type === 'output'),
    ]
    return ordered.map((p, idx) => ({ ...p, offset: pinOffset(p.type as 'input' | 'output', idx) }))
  })
  const positioned = new Map(virtualParams.map(p => [p.id, p]))

  const visibleIds = visibleNodes.map(n => n.id)

  return {
    nodes: visibleNodes,
    params: [
      ...params.filter(p => visibleIds.includes(p.parentId)),
      ...virtualParams,
    ],
    edges: [...viewEdges.values()].map(e => ({
      src: positioned.get(e.src.id) ?? e.src,
      dst: positioned.get(e.dst.id) ?? e.dst,
    })),
  }
}
