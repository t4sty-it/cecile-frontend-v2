import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import * as p from '@/data/Point';
import { Point } from "@/data/Point";
import { fuzzyFilter, fuzzyFind, reverseFuzzyFilter } from "@/utils/fuzzyFind";
import * as g from '../graph';
import * as s from '../set';
import { parse } from "./parser";

type BaseTerm = {
    node: string,
    label: string | null,
    params?: { name: string, value: number | string }[]
}

type Creator = BaseTerm & {
  action: 'create',
  quantity?: number
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

function isCreator(x: Object): x is Creator {
  return Object.keys(x).includes('action') && (x as {action: any}).action === 'create'
}

function isSelector(x: Object): x is Selector {
  return Object.keys(x).includes('action') && (x as {action: any}).action === 'select'
}

function isConnector(x: Object): x is Connector {
  return Object.keys(x).includes('action') && (x as {action: any}).action === 'connect'
}

type Term = Creator | Selector
type Graph = g.Graph<Node, Param>

export function exec(
  command: string,
  graph: Graph,
  nodeBuilders: Record<string, () => [Node, Param[]]>,
  origin: Point
): Graph {

  // SELECT -> CREATE -> CONNECT

  const parsedTerms = parse(command) as (Term | Connector)[]
  
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

function matchNode(name: string, label: string | null, node: Node): boolean {
  return (
    fuzzyFind(name, [node.name]).length > 0 ||
    (
      label != null && label != '' &&
      node.label != null && node.label != '' &&
      fuzzyFind(label, [node.label!]).length > 0
    )
  )
}

export function execCreate(
  nodeBuilders: Record<string, () => [Node, Param[]]>,
  cmd: Creator,
  origin: Point,
): Graph {

  const nodeName = fuzzyFind(cmd.node, Object.keys(nodeBuilders))[0]

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
    eval(`(() => { const z = ${ctx.idx}; const n = ${ctx.idx+1}; const r = ${Math.random()}; return (${s})})()`)
  

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
  
  const srcParams = op.outlet
    ? fuzzyFilter(op.outlet, s.valuesOf(src.params), x => x.name)
    : s.valuesOf(src.params).filter(x => x.name == 'output')

  const dstParams = op.inlet
    ? fuzzyFilter(op.inlet, s.valuesOf(dst.params), x => x.name)
    : s.valuesOf(dst.params).filter(x => x.name == 'input')

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
  const padding = 8
  const gap = 20
  const paramHeight = 25

  const nodeHeight = padding + (paramHeight * (numParams + 1))

  return p.of(
    0,
    (nodeHeight + gap) * nodeIndex
  )
}