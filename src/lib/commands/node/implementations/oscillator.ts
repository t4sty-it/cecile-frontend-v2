import { ParamDataBuilder } from "..";

export const oscillator: ParamDataBuilder = () => [
	{
		name: 'shape',
		dataType: 'string',
		type: 'input',
		options: [
			{
				label: 'Sine',
				value: 'sine'
			},
			{
				label: 'Triangle',
				value: 'triangle'
			},
			{
				label: 'Square',
				value: 'square'
			},
			{
				label: 'Sawtooth',
				value: 'sawtooth'
			}
		],
	},
	
	{
		name: 'frequency',
		dataType: 'number',
		type: 'input',
	},

	{
		name: 'gain',
		dataType: 'number',
		type: 'input'
	},

	{
		name: 'out',
		dataType: 'signal',
		type: 'output'
	}
]