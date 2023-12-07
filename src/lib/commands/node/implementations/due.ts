import { Node } from "@/data/Node"
import { Param } from "@/data/Param"
import { NodeBuilder, NodeParamsBuilder } from ".."

export const due: NodeParamsBuilder = (node, _) => {

  const output: Param = {
    id: '' + Math.random(),
    name: 'out',
    dataType: 'signal',
    parentId: node.id,
    type: 'output',
    offset: {x: 0, y: 0}
  }

  return [output]
}