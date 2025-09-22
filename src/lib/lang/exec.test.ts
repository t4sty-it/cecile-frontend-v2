import { test, expect } from 'bun:test'
import { exec, execConnect, execCreate, execSelect, horizontalOffset } from './exec'
import { graphOf } from '../graph'
import { Node } from '@/data/Node'
import { Param } from '@/data/Param'
import { length, valuesOf } from '../set'
import * as p from '@/data/Point'

const pos = () => ({x: 0, y: 0})

function makeGraph() {
  return graphOf<Node, Param>(
    [
      { id: 'n1', name: 'x', position: pos()},
      { id: 'n2', name: 'y', position: pos()},
    ],

    [
      { id: 'p1', dataType: 'number', name: 'output', offset: pos(), type: 'output', parentId: 'n1' },
      { id: 'p2', dataType: 'number', name: 'input', offset: pos(), type: 'input', parentId: 'n2' },
    ],

    []
  )
}

test('execSelection', () => {
  const graph = makeGraph()

  const selection = execSelect(graph, { action: 'select', label: null, node: 'x' })
  expect(length(selection.nodes)).toBe(1)
  expect(length(selection.params)).toBe(1)
  const n = valuesOf(selection.nodes)[0]
  const p = valuesOf(selection.params)[0]
  expect(p.parentId).toBe(n.id)
})

test('execCreate', () => {
  const nodeBuilders: Record<string, () => [Node, Param[]]> = {
    x: () => [
      {id: 'x', name: 'x', position: pos()},
      [
        {id: 'xp', parentId: 'x', dataType: 'number', name: 'p', offset: pos(), type: 'input'}
      ]
    ]
  }
  const creation = execCreate(nodeBuilders, {action: 'create', node: 'x', quantity: 1, label: null}, {x: 0, y: 0})
  expect(length(creation.nodes)).toBe(1)
  expect(length(creation.params)).toBe(1)
  expect(length(creation.edges)).toBe(0)
})

test('execConnect', () => {
  const g1 = graphOf<Node, Param>(
    [
      { id: 'n1', name: 'x', position: pos() },
      { id: 'n3', name: 'x', position: pos() }
    ],
    [
      { id: 'p1', dataType: 'number', name: 'output', offset: pos(), type: 'output', parentId: 'n1' },
      { id: 'p2', dataType: 'number', name: 'output', offset: pos(), type: 'output', parentId: 'n3' }
    ],
    []
  )

  const g2 = graphOf<Node, Param>(
    [{ id: 'n2', name: 'y', position: pos() }],
    [{ id: 'p2', dataType: 'number', name: 'input', offset: pos(), type: 'input', parentId: 'n2' }],
    []
  )
 
  const c1 = execConnect(g1, {action: 'connect', type: 'M1'}, g2)
  expect(length(c1.edges)).toBe(2)

  const c2 = execConnect(g1, {action: 'connect', type: '11', inlet: 'i'}, g2)
  expect(length(c2.edges)).toBe(1)
})

test('exec', () => {

  const pos = () => ({x: 0, y: 0})

  const graph = graphOf<Node, Param>(
    [
      {id: 'n1', name: 'x', position: pos(), value: 0} as Node,
      {id: 'n2', name: 'y', position: pos(), value: 1} as Node,
    ],

    [
      {id: 'p1', dataType: 'number', name: 'output', offset: pos(), type: 'output', parentId: 'n1'},
      {id: 'p2', dataType: 'number', name: 'input', offset: pos(), type: 'output', parentId: 'n2'},
    ],
    
    []
  )
  const result = exec('$x = $y', graph, {}, {x: 0, y: 0}, {})

  expect(valuesOf(result!.edges).length).toBe(1)
})

test('horizontalOffset', () => {
  expect(horizontalOffset(0)).toEqual(p.of(0, 0))
  expect(horizontalOffset(1).x).toBeGreaterThan(0)
  expect(horizontalOffset(1).x).toBeLessThan(horizontalOffset(2).x)
})