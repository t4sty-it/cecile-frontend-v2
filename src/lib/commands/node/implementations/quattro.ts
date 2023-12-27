import { ParamDataBuilder } from "..";

export const quattro: ParamDataBuilder = () => [
  {
    name: 'option',
    options: [
      {label: 'Option 1', value: 1},
      {label: 'Option 2', value: 2},
    ],
    type: 'input',
    dataType: 'string',
  }
]