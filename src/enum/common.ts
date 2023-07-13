/**
 * + 21-08-26 icon 种类
 *
 * @export
 * @enum {number}
 */
export enum IconTypeEnum {
	/**
	 * 脉冲 icon
	 */
	TY_PULSING_ICON,
	/**
	 * 圆圈 icon,非脉冲 icon,动态半径
	 */
	DYNAMIC_CIRCLE_ICON,

	/**
	 * 圆圈 icon,非脉冲icon,静态半径
	 */
	FIXED_CIRCLE_ICON,

	/**
	 * 静态半径的海洋站增水 icon
	 */
	FIXED_STATION_SURGE_ICON,

	/**
	 * 台风路径示意 icon
	 */
	TY_PATH_ICON,
}

/**
 * @description 潮位站icon显示枚举
 * @author evaseemefly
 * @date 2023/03/29
 * @export
 * @enum {number}
 */
export enum StationIconShowTypeEnum {
	/**
	 * 显示海洋站icon及数值
	 */
	SHOW_SURGE_VAL,
	/**
	 * 显示海洋站状态
	 */
	SHOW_STATION_STATUS,
}
/**
 * + 23-01-06 标量场-图层展示类型
 */
export enum ScalarShowTypeEnum {
	/**
	 * 栅格图层
	 */
	RASTER,
	/** 等值面 */
	ISOSURFACE,
}

const getEnumVal = <T>(tempEnum: T, index: number): string => {
	const areaStr = tempEnum[index]
	return areaStr
}

/**
 * @description 控制 隐藏|展开 的枚举
 * @author evaseemefly
 * @date 2022/11/06
 * @export
 * @enum {number}
 */
export enum IExpandEnum {
	/** 不展开 */
	UN_EXPANDED,
	/** 展开 */
	EXPANDED,
	/** 未选择 */
	UN_SELECTED,
}

export { getEnumVal }
