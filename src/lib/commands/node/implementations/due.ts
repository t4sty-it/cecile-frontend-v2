import { ParamDataBuilder } from ".."

export const due: ParamDataBuilder = () => [
  {
    name: 'out',
    dataType: 'signal',
    type: 'output',
    offset: {x: 0, y: 0}
  }
]