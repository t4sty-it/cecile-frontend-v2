import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import * as p from '@/data/Point';
import { Point } from "@/data/Point";
import { fuzzyFilter, fuzzyFind, reverseFuzzyFilter } from "@/utils/fuzzyFind";
import * as g from '../graph';
import * as s from '../set';
import { HelpedCommand, MetaCommand, parse } from "./parser";

type BaseTerm = {
    node: string | null,
    label: string | null,
    params?: { name: string, value: number | string }[]
}

type Creator = BaseTerm & {
  action: 'create',
  quantity?: number,
  node: string
}

type Selector = BaseTerm & {
  action: 'select'
}

type Connector = {
  action: 'connect',
  type: '1M' | '11' | 'M1',
  inlet?: string,
  outlet?: string,
}

const id = <T>(action: string) => (x: unknown): x is T =>
  typeof x === 'object' && x !== null && 'action' in x && x.action === action

const isHelpedCommand = id<HelpedCommand>('help')
const isMetaCommand = id<MetaCommand>('meta')
const isCreator = id<Creator>('create')
const isSelector = id<Selector>('select')
const isConnector = id<Connector>('connect')


type Term = Creator | Selector
type Graph = g.Graph<Node, Param>

// Thrown for invalid-but-anticipated user input (e.g. an unresolvable
// outlet/inlet name) so callers can catch it and show a message, as opposed
// to a genuine programming error.
export class CommandError extends Error {}

// Executes a program of one or more lines and returns the diff to union into
// `graph`. Lines run in order, each as if typed on its own: selectors in a
// line also see the nodes created by the lines before it. Nothing is applied
// unless every line succeeds, since the whole diff is returned at once.
export function exec(
  command: string,
  graph: Graph,
  nodeBuilders: Record<string, () => [Node, Param[]]>,
  origin: Point,
  metaCommands: Record<string, (...args: string[]) => void>
): Graph {

  const lines = parse(command) as unknown[]

  return lines.reduce<{ diff: Graph, origin: Point }>(
    ({ diff, origin }, line) => {
      if (isMetaCommand(line)) {
        execMeta(metaCommands, line)
        return { diff, origin }
      }

      if (isHelpedCommand(line))
        throw new CommandError('Help (?) is not implemented yet')

      const current = g.union(graph, diff)
      const lineDiff = execLine(line as (Term | Connector)[], current, nodeBuilders, origin)

      // the next line starts below the nodes this one created
      const created = s.valuesOf(s.subtract(lineDiff.nodes, current.nodes))
      const bottom = Math.max(0, ...created.map(node =>
        node.position.y - origin.y + nodeHeight(paramsOf(lineDiff, node).length)
      ))

      return {
        diff: g.union(diff, lineDiff),
        origin: created.length ? p.add(origin, p.of(0, bottom + lineGap)) : origin,
      }
    },
    { diff: g.graphOf<Node, Param>([], [], []), origin }
  ).diff
}

const lineGap = 60

function paramsOf(graph: Graph, node: Node): Param[] {
  return s.valuesOf(graph.params).filter(param => param.parentId == node.id)
}

// SELECT -> CREATE -> CONNECT
function execLine(
  parsedTerms: (Term | Connector)[],
  graph: Graph,
  nodeBuilders: Record<string, () => [Node, Param[]]>,
  origin: Point,
): Graph {
  return parsedTerms
    .map(cmd => isSelector(cmd)
      ? execSelect(graph, cmd)
      : cmd)
    .map((cmd, idx) => isCreator(cmd)
      ? execCreate(
          nodeBuilders,
          cmd,
          p.add(
            origin,
            
            // 1 every 2 commands is a selector, so we account for that
            // by dividing idx by 2
            horizontalOffset(idx/2)
          )
        )
      : cmd)
    .map((cmd, idx, arr) => isConnector(cmd)
      ? (execConnect(arr[idx - 1] as Graph, cmd, arr[idx + 1] as Graph))
      : cmd)
    .reduce((acc, cur) => g.union(acc, cur))
}

export function execMeta(metaCommands: Record<string, (...args: string[]) => void>, metaCommand: MetaCommand ) {
  const {target, args } = metaCommand
  if (target in metaCommands) {
    metaCommands[target](...args)
  }
  else console.error('command not found: ' + target)
}

export function execSelect
(graph: Graph, cmd: Selector)
: Graph
{
  const matchedNodes = s.filter(
    graph.nodes,
    node => matchNode(cmd.node, cmd.label, node)
  )

  const matchedNodesId = s.valuesOf(matchedNodes).map(node => node.id)
  const matchedNodeParams = s.filter(graph.params, p => matchedNodesId.includes(p.parentId))

  return g.graphOf(matchedNodes, matchedNodeParams, [])
}

function matchNode(name: string | null, label: string | null, node: Node): boolean {
  const labelMatches = label != null && node.label != null && fuzzyFind(label, [node.label]).length > 0
  const nameMatches = name != null && fuzzyFind(name, [node.name]).length > 0

  if (label == null && name == null) throw 'Cannot have both label and name null'
  if (label != null && name == null) return labelMatches
  if (label == null && name != null) return nameMatches
  if (label != null && name != null) return labelMatches && nameMatches

  throw '???'
}

export function execCreate(
  nodeBuilders: Record<string, () => [Node, Param[]]>,
  cmd: Creator,
  origin: Point,
): Graph {

  const nodeName = fuzzyFind(cmd.node, Object.keys(nodeBuilders))[0]

  if (nodeName == null)
    throw new CommandError(`"${cmd.node}" is not a valid module name`)

  const toLabelledNode: (i:[Node, Param[]]) => [Node, Param[]] =
  ([node, params]) => [
    ({...node, label: cmd.label ?? undefined}),
    params
  ]
  
  const toPositionedNode: (n: [Node, Param[]], idx: number) => [Node, Param[]] =
  ([node, params], idx) => [
    ({
      ...node,
      position: p.add(
        origin,
        verticalOffset(params.length, idx)
      )
    }),
    params
  ]


  const toValuedParams: (n: [Node, Param[]], idx: number) => [Node, Param[]] = 
  ([node, params], idx) => [
    node,
    cmd.params
      ? params.map((param) => _toValuedParam(reverseFuzzyFilter(cmd.params!, param.name, p => p.name), param, idx))
      : params
  ]

  const _toValuedParam: (cmdParam: {name: string, value: string | number} | undefined, param: Param, idx: number) => Param =
  (cmdParam, param, idx) => ({
    ...param,
    value: cmdParam
      ? param.options
        ? fuzzyFilter(
            evalWithContext(cmdParam.value + '', {idx: idx}),
            param.options,
            o => o.value + ''
          )[0]?.value
        : evalWithContext(cmdParam.value + '', {idx: idx})
      : param.value
  })

  const evalWithContext = (s: string, ctx: {idx: number}) =>
    // indirect eval: the expression runs in global scope, it only needs z/n/r
    (0, eval)(`(() => { const z = ${ctx.idx}; const n = ${ctx.idx+1}; const r = ${Math.random()}; return (${s})})()`)
  

  return [...Array(cmd.quantity ?? 1).keys()]
    .map(_ => nodeBuilders[nodeName]())
    .map(toLabelledNode)
    .map(toPositionedNode)
    .map(toValuedParams)
    .reduce(
      (acc, cur) => g.union(
        acc,
        g.graphOf([cur[0]], cur[1], [])
      ),
      g.graphOf<Node, Param>([],[],[])
    )
}

export function execConnect(src: Graph, op: Connector, dst: Graph): Graph {

  // an outlet only ever refers to an audio output, and an inlet only ever to
  // an audio input - a 'param' (e.g. a device selector, a knob value) can
  // never be a wiring endpoint, no matter how well its name fuzzy-matches
  const srcOutputs = s.valuesOf(src.params).filter(x => x.type == 'output')
  const dstInputs = s.valuesOf(dst.params).filter(x => x.type == 'input')

  const srcParams = op.outlet
    ? fuzzyFilter(op.outlet, srcOutputs, x => x.name)
    : srcOutputs.filter(x => x.name == 'output')

  const dstParams = op.inlet
    ? fuzzyFilter(op.inlet, dstInputs, x => x.name)
    : dstInputs.filter(x => x.name == 'input')

  if (op.outlet && srcParams.length == 0)
    throw new CommandError(`No output named "${op.outlet}" found`)

  if (op.inlet && dstParams.length == 0)
    throw new CommandError(`No input named "${op.inlet}" found`)

  return g.graphOf<Node, Param>(
    s.union(src.nodes, dst.nodes),
    s.union(src.params, dst.params),
    op.type == '11'
      ? connect11(srcParams, dstParams)
      : connectMM(srcParams, dstParams)
  )
}

function connect11(srcParams: Param[], dstParams: Param[]): g.Edge[] {
  return srcParams
  .map(
    (srcParam, idx) => dstParams[idx]
      ? {
        id: `${srcParam.id}:${dstParams[idx].id}`,
        src: srcParam.id,
        dst: dstParams[idx].id
      }
      : null
  )
  .filter(Boolean) as g.Edge[]
}

function connectMM(srcParams: Param[], dstParams: Param[]): g.Edge[] {
  return srcParams.flatMap(
    srcParam => dstParams.map(
      dstParam => ({
        id: `${srcParam.id}:${dstParam.id}`,
        src: srcParam.id,
        dst: dstParam.id
      })
    )
  )
}

export function horizontalOffset(nodeIndex: number): Point {
  const nodeWidth = 220
  const gap = 60

  return p.of((nodeWidth + gap) * nodeIndex, 0)
}

export function verticalOffset(numParams: number, nodeIndex: number): Point {
  const gap = 20

  return p.of(
    0,
    (nodeHeight(numParams) + gap) * nodeIndex
  )
}

export function nodeHeight(numParams: number): number {
  const padding = 8
  const paramHeight = 25

  return padding + (paramHeight * (numParams + 1))
}