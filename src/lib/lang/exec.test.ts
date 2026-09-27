import { test, expect } from 'bun:test'
import { CommandError, exec, execConnect, execCreate, execSelect, horizontalOffset } from './exec'
import { graphOf } from '../graph'
import { Node } from '@/data/Node'
import { Param } from '@/data/Param'
import { length, valuesOf } from '../set'
import * as p from '@/data/Point'

const pos = () => ({x: 0, y: 0})

function catchThrown(fn: () => unknown): unknown {
  try {
    fn()
    return undefined
  } catch (e) {
    return e
  }
}

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

test('execCreate throws a recoverable CommandError when no node builder matches', () => {
  const nodeBuilders: Record<string, () => [Node, Param[]]> = {
    oscillator: () => [
      {id: 'x', name: 'oscillator', position: pos()},
      []
    ]
  }
  const thrown = catchThrown(() =>
    execCreate(nodeBuilders, {action: 'create', node: 'zzz', quantity: 1, label: null}, {x: 0, y: 0})
  )
  expect(thrown).toBeInstanceOf(CommandError)
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

function midiKeyboardInLikeGraph() {
  // Mirrors midi-keyboard-in's real params: a 'device' param (type 'param',
  // just a config value) alongside 'frequency'/'velocity' outputs (type
  // 'output', real signal sources).
  return graphOf<Node, Param>(
    [{ id: 'n1', name: 'midi-keyboard-in', position: pos() }],
    [
      { id: 'p-device', dataType: 'string', name: 'device', offset: pos(), type: 'param', parentId: 'n1' },
      { id: 'p-frequency', dataType: 'number', name: 'frequency', offset: pos(), type: 'output', parentId: 'n1' },
      { id: 'p-velocity', dataType: 'number', name: 'velocity', offset: pos(), type: 'output', parentId: 'n1' },
    ],
    []
  )
}

function ahrLikeGraph() {
  return graphOf<Node, Param>(
    [{ id: 'n2', name: 'ahr', position: pos() }],
    [{ id: 'p-input', dataType: 'number', name: 'input', offset: pos(), type: 'input', parentId: 'n2' }],
    []
  )
}

test('execConnect never wires an outlet to a non-output param, even on a fuzzy substring match', () => {
  // 'device' contains a 'v' but is a config param, not an audio output - it
  // must never be treated as a valid match for outlet 'v'.
  const c = execConnect(midiKeyboardInLikeGraph(), {action: 'connect', type: 'M1', outlet: 'v'}, ahrLikeGraph())
  expect(length(c.edges)).toBe(1)
  expect(valuesOf(c.edges)[0].src).toBe('p-velocity')
})

test('execConnect throws a recoverable CommandError when an outlet only matches a non-output param', () => {
  const thrown = catchThrown(() =>
    execConnect(midiKeyboardInLikeGraph(), {action: 'connect', type: 'M1', outlet: 'device'}, ahrLikeGraph())
  )
  expect(thrown).toBeInstanceOf(CommandError)
})

test('execConnect throws a recoverable CommandError when an inlet only matches a non-input param', () => {
  const g1 = graphOf<Node, Param>(
    [{ id: 'n1', name: 'osc', position: pos() }],
    [{ id: 'p-output', dataType: 'number', name: 'output', offset: pos(), type: 'output', parentId: 'n1' }],
    []
  )

  const g2 = graphOf<Node, Param>(
    [{ id: 'n2', name: 'ahr', position: pos() }],
    [
      { id: 'p-attack', dataType: 'number', name: 'attack', offset: pos(), type: 'param', parentId: 'n2' },
      { id: 'p-input', dataType: 'number', name: 'input', offset: pos(), type: 'input', parentId: 'n2' },
    ],
    []
  )

  const thrown = catchThrown(() =>
    execConnect(g1, {action: 'connect', type: 'M1', inlet: 'attack'}, g2)
  )
  expect(thrown).toBeInstanceOf(CommandError)
})

test('execConnect still fans out an outlet across every output-type param it fuzzy-matches', () => {
  // A loose single-character match against 'e' is expected to hit both
  // outputs ('frequency' and 'velocity' both contain an 'e') - that's fine,
  // as long as neither is the unrelated 'device' param.
  const c = execConnect(midiKeyboardInLikeGraph(), {action: 'connect', type: 'M1', outlet: 'e'}, ahrLikeGraph())
  expect(length(c.edges)).toBe(2)
  expect(valuesOf(c.edges).map(e => e.src).sort()).toEqual(['p-frequency', 'p-velocity'])
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
      {id: 'p2', dataType: 'number', name: 'input', offset: pos(), type: 'input', parentId: 'n2'},
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