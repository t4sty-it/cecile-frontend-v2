import { Param } from "@/data/Param"
import { NodeParamsBuilder } from ".."

export const tre: NodeParamsBuilder = (node, overrides) => {
  
  const input: Param = {
    id: '' + Math.random(),
    name: 'in',
    value: overrides['in'],
    dataType: 'number',
    parentId: node.id,
    type: 'input',
    offset: {x: 0, y: 0}
  }

  return [input]
}