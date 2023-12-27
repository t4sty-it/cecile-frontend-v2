import { ParamDataBuilder } from ".."

export const uno: ParamDataBuilder = () => [
  {
    name: 'in',
    dataType: 'number',
    type: 'input',
  },
  {
    name: 'out',
    dataType: 'signal',
    type: 'output',
  }
]