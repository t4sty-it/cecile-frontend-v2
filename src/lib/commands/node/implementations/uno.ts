import { Param } from "@/data/Param"
import { NodeParamsBuilder } from ".."

export const uno: NodeParamsBuilder = (parent, overrides) => {
  
  const input: Param = {
    id: '' + Math.random(),
    name: 'in',
    dataType: 'number',
    parentId: parent.id,
    type: 'input',
    value: overrides['in'],
    offset: {x: 0, y: 0},
  }
  
  const output: Param = {
    id: '' + Math.random(),
    name: 'out',
    dataType: 'signal',
    parentId: parent.id,
    type: 'output',
    offset: {x: 0, y: 0}
  }

  return [input, output]
}