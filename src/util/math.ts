/**
 * @description 根据传入的最大值，根据切分个数生成数组
 * @author evaseemefly
 * @date 2023/08/03
 * @param {number} max
 * @returns {*}  {number[]}
 */
const getIntegerList = (max: number, splitNum: number, min = 0, effectiveFigure = 1): number[] => {
	const splitList: number[] = []
	/** 保留有效数字后的 max 值 */
	const maxEffectivated = Number(max.toFixed(effectiveFigure))
	const stepNum: number = (maxEffectivated - min) / splitNum
	for (let index = 0; index < splitNum; index++) {
		const element = min + stepNum * index
		splitList.push(element)
	}
	// splitList = [...Array(maxEffectivated - min + 1)].map((e, i) => min + i)
	return splitList
}

export { getIntegerList }
