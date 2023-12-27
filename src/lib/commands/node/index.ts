import { Node } from "@/data/Node";
import { Param, ParamData } from "@/data/Param";
import { Point } from "@/data/Point";
import { uno } from "./implementations/uno";
import { due } from "./implementations/due";
import { tre } from "./implementations/tre";
import { quattro } from "./implementations/quattro";
import { oscillator } from "./implementations/oscillator";

export type NodeBuilder = (
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

export type NodeParamsBuilder = (parent: Node, overrides: Record<string, string>) => Param[]

export type ParamDataBuilder = () => ParamData[]

const buildParams: (node: Node, nodeType: string, overrides: Record<string, string>) => Param[]
= (node, nodeType, overrides) => paramBuilders[nodeType]().map(paramData => ({
  id: Math.random() + '',
  parentId: node.id,
  offset: {x: 0, y: 0},
  value: overrides[paramData.name],
  ...paramData
}))

const paramBuilders: Record<string, ParamDataBuilder> = {
  uno,
  due,
  tre,
  quattro,
  oscillator
}

export const commands = Object.keys(paramBuilders)