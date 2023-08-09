export interface IColorScale {
	key: string
	scale: IScale
}

/** 色标接口 
 * range?: number[]
	scaleColorList: string | string[] */
export interface IScale {
	range: number[]
	scaleColorList: string | string[]
}

const DEFAULT_COLOR_INDEX = -1
const DEFAULT_COLOR_KEY = 'my-colour'
// const DEFAULT_RANGE = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
const DEFAULT_RANGE = [0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0]

/**默认色标 
 * 	{range: number[],
	scaleColorList: string[],} */
const DEFAULT_COLOR_SCALE: IScale = {
	range: DEFAULT_RANGE,
	scaleColorList: [
		'#4575b4',
		'#74add1',
		'#abd9e9',
		'#e0f3f8',
		'#ffffbf',
		'#fee090',
		'#fdae61',
		'#f46d43',
		'#d73027',
	],
}

const ColorScales: { key: string; scale: IScale }[] = [
	{
		key: 'my-colour',
		scale: {
			range: DEFAULT_RANGE,
			scaleColorList: [
				'#4575b4',
				'#74add1',
				'#abd9e9',
				'#e0f3f8',
				'#ffffbf',
				'#fee090',
				'#fdae61',
				'#f46d43',
				'#d73027',
			],
		},
	},
	{
		key: 'my-rainbow',
		scale: {
			range: DEFAULT_RANGE,
			scaleColorList: [
				'rgb(98, 113, 184)',
				'rgb(98, 113, 184)',
				'rgb(61, 110, 163)',
				'rgb(74, 148, 170)',
				'rgb(74, 146, 148)',
				'rgb(77, 142, 124)',
				'rgb(76, 164, 76)',
				'rgb(103, 164, 54)',
				'rgb(162, 135, 64)',
				'rgb(162, 109, 92)',
				'rgb(141, 63, 92)',
				'rgb(151, 75, 145)',
			],
		},
	},
	{
		key: 'my-ocean',
		scale: {
			range: DEFAULT_RANGE,
			scaleColorList: [
				'#ffffd9',
				'#edf8b1',
				'#c7e9b4',
				'#7fcdbb',
				'#41b6c4',
				'#1d91c0',
				'#225ea8',
				'#253494',
				'#081d58',
			],
		},
	},
]

const getColorScale = (key: string): IScale => {
	const colorScaleObj: { key: string; scale: IScale } | undefined =
		ColorScales.find((temp) => temp.key === key) ||
		ColorScales.find((temp) => temp.key == DEFAULT_COLOR_KEY)
	return (colorScaleObj && colorScaleObj.scale) || DEFAULT_COLOR_SCALE
}

export { ColorScales, DEFAULT_COLOR_INDEX, DEFAULT_COLOR_SCALE, DEFAULT_COLOR_KEY, getColorScale }
