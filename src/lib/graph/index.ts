import { Set, setOf } from "../set"
import * as set from '../set'

export type Signed<T extends object> = T & {id: string}
export type Child<T extends object> = Signed<T> & { parentId: string } 

export type Edge = Signed<{src: string, dst: string}>

export type Graph<N extends Signed<object>, P extends Child<object>> = {
  nodes: Set<N>,
  params: Set<P>,
  edges: Set<Edge>
}

export function graphOf
<N extends Signed<object>, P extends Child<object>>
(
  nodes: N[] | Set<N>,
  params: P[] | Set<P>,
  edges: Edge[] | Set<Edge>
): Graph<N, P>
{
  return {
    nodes: Array.isArray(nodes)
      ? setOf(nodes, n => n.id)
      : nodes,
    params: Array.isArray(params)
      ? setOf(params, p => p.id)
      : params,
    edges: Array.isArray(edges)
      ? setOf(edges, e => e.id)
      : edges
  }
}

export function union<N extends Signed<object>, P extends Child<object>>(a: Graph<N, P>, b: Graph<N, P>): Graph<N, P> {
  return graphOf(
    set.union(a.nodes, b.nodes),
    set.union(a.params, b.params),
    set.union(a.edges, b.edges)
  )
}

type FilterFunc<T> = (item: T, idx: number, arr: T[]) => boolean 
export function filter
<N extends Signed<object>, P extends Child<object>>
(
  graph: Graph<N, P>,
  nodeFilter: FilterFunc<N>,
  paramFilter: FilterFunc<P>,
  edgeFilter: FilterFunc<Edge>
)
{
  return graphOf(
    set.filter(graph.nodes, nodeFilter),
    set.filter(graph.params, paramFilter),
    set.filter(graph.edges, edgeFilter)
  )
}

export function parentNode<N extends Signed<object>, P extends Child<object>>(graph: Graph<N, P>, param: P): N | null {
  return set.valueOf(graph.nodes, param.parentId)
}

export function valuesOf<N extends Signed<object>, P extends Child<object>>(graph: Graph<N, P>): [N[], P[], Edge[]] {
  return [
    set.valuesOf(graph.nodes),
    set.valuesOf(graph.params),
    set.valuesOf(graph.edges),
  ]
}