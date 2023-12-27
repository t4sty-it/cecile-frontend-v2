import { ParamDataBuilder } from ".."

export const tre: ParamDataBuilder = () => [
  {
    id: '' + Math.random(),
    name: 'in',
    dataType: 'number',
    type: 'input',
  }
]