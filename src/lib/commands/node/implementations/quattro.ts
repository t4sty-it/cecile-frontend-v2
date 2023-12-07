import { NodeParamsBuilder } from "..";

export const quattro: NodeParamsBuilder = (node, overrides) => {
  return [
    {
      id: '' + Math.random(),
      name: 'option',
      options: [
        {label: 'Option 1', value: 1},
        {label: 'Option 2', value: 2},
      ],
      type: 'input',
      dataType: 'string',
      parentId: node.id,
      offset: {x:0, y:0},
      value: overrides['option']
    }
  ]
}