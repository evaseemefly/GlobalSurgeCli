/**
 * + 23-03-29
 * 处理时间的工具类
 */

/**
 * @description 获取 dt1-dt2 的 ms
 * @author evaseemefly
 * @date 2023/03/29
 * @param {Date} dt1
 * @param {Date} dt2
 * @returns {*}  {number}
 */
const getDateDiffMs = (dt1: Date, dt2: Date): number => {
	return dt1.getTime() - dt2.getTime()
}

export { getDateDiffMs }
