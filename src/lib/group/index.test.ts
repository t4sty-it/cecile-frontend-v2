import { describe, expect, test } from "bun:test"
import { Edge } from "@/data/Edge"
import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { descendantIds, groupNodes, ungroupNode, viewOf } from "."

const node = (id: string, parentId?: string, x = 0): Node =>
  ({ id, name: id, position: { x, y: 0 }, parentId })

const param = (id: string, parentId: string, type: Param['type']): Param =>
  ({ id, parentId, name: type, type, dataType: 'signal', offset: { x: 0, y: 0 } })

const io = (id: string) => [param(`${id}.in`, id, 'input'), param(`${id}.out`, id, 'output')]

const edge = (src: string, dst: string, params: Param[]): Edge => ({
  src: params.find(p => p.id === `${src}.out`)!,
  dst: params.find(p => p.id === `${dst}.in`)!,
})

describe('viewOf', () => {
  test('one input pin per distinct external source', () => {
    // gain > 2*osc, oscs grouped
    const nodes = [node('gain'), node('g'), node('o1', 'g'), node('o2', 'g')]
    const params = [...io('gain'), ...io('o1'), ...io('o2')]
    const edges = [edge('gain', 'o1', params), edge('gain', 'o2', params)]

    const view = viewOf(nodes, params, edges, undefined)

    expect(view.nodes.map(n => n.id)).toEqual(['gain', 'g'])
    const pins = view.params.filter(p => p.parentId === 'g')
    expect(pins.map(p => [p.name, p.type])).toEqual([['input', 'input']])
    expect(view.edges).toHaveLength(1)
    expect(view.edges[0].src.id).toBe('gain.out')
    expect(view.edges[0].dst.id).toBe(pins[0].id)
  })

  test('one output pin per distinct internal source', () => {
    // 2*gain > osc, gains grouped
    const nodes = [node('g'), node('a', 'g'), node('b', 'g'), node('osc')]
    const params = [...io('a'), ...io('b'), ...io('osc')]
    const edges = [edge('a', 'osc', params), edge('b', 'osc', params)]

    const view = viewOf(nodes, params, edges, undefined)

    const pins = view.params.filter(p => p.parentId === 'g')
    expect(pins.map(p => p.name)).toEqual(['output', 'o1'])
    expect(view.edges).toHaveLength(2)
  })

  test('hides internal edges and edges leaving the current level', () => {
    const nodes = [node('g'), node('a', 'g'), node('b', 'g'), node('c')]
    const params = [...io('a'), ...io('b'), ...io('c')]
    const edges = [edge('a', 'b', params), edge('c', 'a', params)]

    expect(viewOf(nodes, params, edges, undefined).edges).toHaveLength(1)

    const inner = viewOf(nodes, params, edges, 'g')
    expect(inner.nodes.map(n => n.id)).toEqual(['a', 'b'])
    expect(inner.edges).toHaveLength(1)
    expect(inner.edges[0].src.id).toBe('a.out')
  })

  test('nested groups collapse into the visible ancestor', () => {
    const nodes = [node('outer'), node('inner', 'outer'), node('a', 'inner'), node('b')]
    const params = [...io('a'), ...io('b')]
    const edges = [edge('a', 'b', params)]

    const root = viewOf(nodes, params, edges, undefined)
    expect(root.nodes.map(n => n.id)).toEqual(['outer', 'b'])
    expect(root.edges[0].src.parentId).toBe('outer')

    const level1 = viewOf(nodes, params, edges, 'outer')
    expect(level1.nodes.map(n => n.id)).toEqual(['inner'])
    expect(level1.edges).toHaveLength(0)
  })

  test('virtual pins are laid out inputs first', () => {
    const nodes = [node('x'), node('g'), node('a', 'g'), node('y')]
    const params = [...io('x'), ...io('a'), ...io('y')]
    const edges = [edge('a', 'y', params), edge('x', 'a', params)]

    const pins = viewOf(nodes, params, edges, undefined).params.filter(p => p.parentId === 'g')
    expect(pins.map(p => p.type)).toEqual(['input', 'output'])
    expect(pins[0].offset.y).toBeLessThan(pins[1].offset.y)
  })
})

describe('grouping', () => {
  test('groups only nodes at the current level, at their centroid', () => {
    const nodes = [node('a', undefined, 0), node('b', undefined, 100), node('c', 'other')]
    const grouped = groupNodes(nodes, ['a', 'b', 'c'], undefined, 'g')

    const g = grouped.find(n => n.id === 'g')!
    expect(g.position).toEqual({ x: 50, y: 0 })
    expect(grouped.filter(n => n.parentId === 'g').map(n => n.id)).toEqual(['a', 'b'])
    expect(grouped.find(n => n.id === 'c')!.parentId).toBe('other')
  })

  test('ungrouping reparents children to the group parent', () => {
    const nodes = [node('outer'), node('g', 'outer'), node('a', 'g')]
    nodes[1].name = 'group'
    const ungrouped = ungroupNode(nodes, 'g')

    expect(ungrouped.map(n => n.id)).toEqual(['outer', 'a'])
    expect(ungrouped[1].parentId).toBe('outer')
  })

  test('descendantIds walks nested groups', () => {
    const nodes = [node('g'), node('h', 'g'), node('a', 'h'), node('b')]
    expect(descendantIds(nodes, ['g']).toSorted()).toEqual(['a', 'g', 'h'])
  })
})
