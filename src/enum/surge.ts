import { getEnumVal } from './common'

/**
 * + 21-08-25
 * 4色警戒潮位
 * @export
 * @enum {number}
 */
export enum AlertTideEnum {
	GREEN = 5000,
	BLUE = 5001,
	YELLOW = 5002,
	ORANGE = 5003,
	RED = 5004,
}

/**
 * @description 预报产品种类枚举
 * @author evaseemefly
 * @date 2024/11/29
 * @export
 * @enum {number}
 */
export enum ForecastProductTypeEnum {
	/** 最大增水 */
	SURGE_MAX = 5101,
	/** 逐时增水 */
	SURGE_HOURLY = 5102,
}

export enum SurgeForecastAreaEnum {}

const getStatueVal = (x: AlertTideEnum, index: number): string => {
	return getEnumVal<AlertTideEnum>(x, index)
}

export { getStatueVal }
