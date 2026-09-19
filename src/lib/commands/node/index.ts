import { Node } from "@/data/Node";
import { Param } from "@/data/Param";
import { Point } from "@/data/Point";

import { nodes } from "./nodes";


type NodeBuilder = (
  nodeType: string,
  args: {
  nodeOverrides: Partial<Node> & { name: string, position: Point}
  paramOverrides?: Record<string, string>
}) => [Node, Param[]]

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

  const params = buildParams(node, nodeType, paramOverrides)

  return [node, params]
}

const buildParams: (node: Node, nodeType: string, overrides: Record<string, string>) => Param[]
= (node, nodeType, overrides) => nodes[nodeType].params().map(paramData => ({
  id: Math.random() + '',
  parentId: node.id,
  offset: {x: 0, y: 0},
  ...paramData,
  value: overrides[paramData.name] ?? paramData.value
}))

export const commands = Object.keys(nodes)