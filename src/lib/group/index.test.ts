import { describe, expect, test } from "bun:test"
import { Edge } from "@/data/Edge"
import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { descendantIds, GraphData, groupNodes, normalize, PortBuilder, ungroupNode, viewOf } from "."

const node = (id: string, parentId?: string, x = 0, y = 0): Node =>
  ({ id, name: id, position: { x, y }, parentId })

const param = (id: string, parentId: string, type: Param['type']): Param =>
  ({ id, parentId, name: type, type, dataType: 'signal', offset: { x: 0, y: 0 } })

const io = (id: string) => [param(`${id}.in`, id, 'input'), param(`${id}.out`, id, 'output')]

const edge = (src: string, dst: string, params: Param[]): Edge => ({
  src: params.find(p => p.id === `${src}.out`)!,
  dst: params.find(p => p.id === `${dst}.in`)!,
})

let portCount = 0
const buildPort: PortBuilder = (type, position, parentId) => {
  const id = `${type}${portCount++}`
  return [{ id, name: type, position, parentId }, io(id)]
}

const graphOf = (nodes: Node[], params: Param[], edges: [string, string][]): GraphData =>
  ({ nodes, params, edges: edges.map(([s, d]) => edge(s, d, params)) })

const view = (g: GraphData, parentId?: string) => viewOf(g.nodes, g.params, g.edges, parentId)
const pinsOf = (g: GraphData, groupId: string, parentId?: string) =>
  view(g, parentId).params.filter(p => p.parentId === groupId)

describe('groupNodes', () => {
  test('one inlet per distinct outer source', () => {
    // gain > 2*osc
    const g = graphOf(
      [node('gain'), node('o1'), node('o2')],
      [...io('gain'), ...io('o1'), ...io('o2')],
      [['gain', 'o1'], ['gain', 'o2']],
    )
    const grouped = groupNodes(g, ['o1', 'o2'], undefined, 'g', buildPort)

    const ports = grouped.nodes.filter(n => n.parentId === 'g' && n.name === 'inlet')
    expect(ports).toHaveLength(1)
    const [inlet] = ports
    expect(grouped.edges.map(e => [e.src.parentId, e.dst.parentId]).toSorted()).toEqual([
      ['gain', inlet.id], [inlet.id, 'o1'], [inlet.id, 'o2'],
    ])

    expect(pinsOf(grouped, 'g').map(p => p.name)).toEqual(['input'])
    const root = view(grouped)
    expect(root.edges).toHaveLength(1)
    expect(root.edges[0].dst.parentId).toBe('g')
  })

  test('one outlet per distinct outer destination', () => {
    // 2*gain > osc
    const g = graphOf(
      [node('a'), node('b'), node('osc')],
      [...io('a'), ...io('b'), ...io('osc')],
      [['a', 'osc'], ['b', 'osc']],
    )
    const grouped = groupNodes(g, ['a', 'b'], undefined, 'g', buildPort)

    const outlets = grouped.nodes.filter(n => n.name === 'outlet')
    expect(outlets).toHaveLength(1)
    const [outlet] = outlets
    expect(grouped.edges.map(e => [e.src.parentId, e.dst.parentId]).toSorted()).toEqual([
      ['a', outlet.id], ['b', outlet.id], [outlet.id, 'osc'],
    ])
    expect(pinsOf(grouped, 'g').map(p => p.name)).toEqual(['output'])
    expect(view(grouped).edges).toHaveLength(1)
  })

  test('a chain collapses to one input and one output', () => {
    // gain > f { 3*osc > gain
    const g = graphOf(
      [node('in'), node('o1'), node('o2'), node('o3'), node('out')],
      [...io('in'), ...io('o1'), ...io('o2'), ...io('o3'), ...io('out')],
      [['in', 'o1'], ['in', 'o2'], ['in', 'o3'], ['o1', 'out'], ['o2', 'out'], ['o3', 'out']],
    )
    const grouped = groupNodes(g, ['o1', 'o2', 'o3'], undefined, 'g', buildPort)

    expect(pinsOf(grouped, 'g').map(p => p.name)).toEqual(['input', 'output'])
    expect(view(grouped).edges).toHaveLength(2)

    const ungrouped = ungroupNode(grouped, 'g')
    expect(ungrouped.edges.map(e => `${e.src.id}>${e.dst.id}`).toSorted())
      .toEqual(g.edges.map(e => `${e.src.id}>${e.dst.id}`).toSorted())
  })

  test('only groups nodes at the current level, at their centroid', () => {
    const g = graphOf([node('a', undefined, 0), node('b', undefined, 100), node('c', 'other')], [], [])
    const grouped = groupNodes(g, ['a', 'b', 'c'], undefined, 'g', buildPort)

    expect(grouped.nodes.find(n => n.id === 'g')!.position).toEqual({ x: 50, y: 0 })
    expect(grouped.nodes.filter(n => n.parentId === 'g').map(n => n.id)).toEqual(['a', 'b'])
    expect(grouped.nodes.find(n => n.id === 'c')!.parentId).toBe('other')
  })
})

describe('normalize', () => {
  const nested = () => {
    const nodes = [node('outer'), node('inner', 'outer'), node('a', 'inner'), node('b')]
    nodes[0].group = nodes[1].group = true
    return { nodes, params: [...io('a'), ...io('b')] }
  }

  test('routes an edge leaving nested groups through one outlet per level', () => {
    const { nodes, params } = nested()
    const g = normalize(graphOf(nodes, params, [['a', 'b']]), buildPort)

    const outlets = g.nodes.filter(n => n.name === 'outlet')
    expect(outlets.map(n => n.parentId).toSorted()).toEqual(['inner', 'outer'])
    expect(g.edges).toHaveLength(3)

    expect(pinsOf(g, 'outer').map(p => p.name)).toEqual(['output'])
    expect(view(g).edges).toHaveLength(1)
    expect(view(g, 'outer').edges).toHaveLength(1)
    expect(view(g, 'inner').edges).toHaveLength(1)
  })

  test('reuses the inlet already fed by the same source', () => {
    const nodes = [node('g'), node('a', 'g'), node('c', 'g'), node('x')]
    nodes[0].group = true
    const params = [...io('a'), ...io('c'), ...io('x')]
    const grouped = normalize(graphOf(nodes, params, [['x', 'a']]), buildPort)
    const again = normalize({ ...grouped, edges: [...grouped.edges, edge('x', 'c', params)] }, buildPort)

    expect(again.nodes.filter(n => n.name === 'inlet')).toHaveLength(1)
    expect(pinsOf(again, 'g').map(p => p.name)).toEqual(['input'])
    expect(view(again, 'g').edges).toHaveLength(2)
  })

  test('leaves same-level edges alone', () => {
    const g = graphOf([node('a'), node('b')], [...io('a'), ...io('b')], [['a', 'b']])
    expect(normalize(g, buildPort)).toEqual(g)
  })
})

describe('ungroupNode', () => {
  test('splices ports out and restores direct edges', () => {
    const g = graphOf(
      [node('outer'), node('gain', 'outer'), node('o1', 'outer'), node('o2', 'outer')],
      [...io('gain'), ...io('o1'), ...io('o2')],
      [['gain', 'o1'], ['gain', 'o2']],
    )
    const grouped = groupNodes(g, ['o1', 'o2'], 'outer', 'g', buildPort)
    const ungrouped = ungroupNode(grouped, 'g')

    expect(ungrouped.nodes.map(n => n.id)).toEqual(['outer', 'gain', 'o1', 'o2'])
    expect(ungrouped.nodes.every(n => n.parentId === 'outer' || n.id === 'outer')).toBe(true)
    expect(ungrouped.params).toEqual(g.params)
    expect(ungrouped.edges.map(e => `${e.src.id}>${e.dst.id}`).toSorted())
      .toEqual(g.edges.map(e => `${e.src.id}>${e.dst.id}`).toSorted())
  })
})

describe('viewOf', () => {
  test('port labels name the pins, ordered top to bottom', () => {
    const nodes = [
      node('g'), { ...node('lo', 'g', 0, 200), name: 'inlet', label: 'freq' },
      { ...node('hi', 'g', 0, 0), name: 'inlet' },
      node('x'), node('y'),
    ]
    nodes[0].group = true
    const params = [...io('lo'), ...io('hi'), ...io('x'), ...io('y')]
    const g = graphOf(nodes, params, [['x', 'lo'], ['y', 'hi']])

    const pins = pinsOf(g, 'g')
    expect(pins.map(p => p.name)).toEqual(['input', 'freq'])
    expect(pins.map(p => p.id)).toEqual(['hi.in', 'lo.in'])
  })

  test('inside a group, ports are plain nodes and outer edges are hidden', () => {
    const g = groupNodes(
      graphOf([node('x'), node('a')], [...io('x'), ...io('a')], [['x', 'a']]),
      ['a'], undefined, 'g', buildPort,
    )
    const inner = view(g, 'g')
    expect(inner.nodes.map(n => n.name).toSorted()).toEqual(['a', 'inlet'])
    expect(inner.edges).toHaveLength(1)
    expect(inner.edges[0].dst.id).toBe('a.in')
  })

  test('hides the outer side of ports inside their group', () => {
    const g = groupNodes(
      graphOf([node('x'), node('a')], [...io('x'), ...io('a')], [['x', 'a']]),
      ['a'], undefined, 'g', buildPort,
    )
    const inlet = view(g, 'g').nodes.find(n => n.name === 'inlet')!
    expect(view(g, 'g').params.filter(p => p.parentId === inlet.id).map(p => p.name)).toEqual(['output'])
  })

  test('hides edges internal to a group', () => {
    const nodes = [node('g'), node('a', 'g'), node('b', 'g')]
    nodes[0].group = true
    const g = graphOf(nodes, [...io('a'), ...io('b')], [['a', 'b']])
    expect(view(g).edges).toHaveLength(0)
    expect(view(g, 'g').edges).toHaveLength(1)
  })
})

test('descendantIds walks nested groups', () => {
  const nodes = [node('g'), node('h', 'g'), node('a', 'h'), node('b')]
  expect(descendantIds(nodes, ['g']).toSorted()).toEqual(['a', 'g', 'h'])
})
