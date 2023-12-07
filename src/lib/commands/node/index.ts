import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { Point } from "@/data/Point";
import { uno } from "./implementations/uno";
import { due } from "./implementations/due";
import { tre } from "./implementations/tre";
import { quattro } from "./implementations/quattro";

export type NodeBuilder = (
  nodeType: string,
  args: {
  nodeOverrides: Partial<Node> & { name: string, position: Point}
  paramOverrides?: Record<string, string>
}) => [Node, Param[]]

export type NodeParamsBuilder = (parent: Node, overrides: Record<string, string>) => Param[]

export const buildNode: NodeBuilder = (
  nodeType,
  {
    nodeOverrides,
    paramOverrides = {}
  }
) => {
  const node = {
    id: nodeOverrides.id ?? '' + Math.random(),
    name: nodeOverrides.name ?? nodeType,
    position: nodeOverrides.position
  }

  const params = nodeMap[nodeType](node, paramOverrides)

  return [node, params]
}

const nodeMap: Record<string, NodeParamsBuilder> = {
  'uno': uno,
  'due': due,
  'tre': tre,
  'quattro': quattro,
}