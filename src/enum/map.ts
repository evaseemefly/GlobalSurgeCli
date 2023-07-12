enum ConstLayerTypeEnum {
	UN_LAYER = -1,
}

export enum StationIconLayerEnum {
	/**
	 * 海洋站图层
	 */
	ICON_STATION = 1011,
}

/** 基础图层枚举 */
enum BaseLayerTypeEnum {
	/**
	 * 有效波高-栅格图层
	 */
	RASTER_LAYER_WVE = 2001,
	/**
	 * 平均波周期-栅格图层
	 */
	RASTER_LAYER_MWP = 2002,
	/**
	 * 平均波向-栅格图层
	 */
	RASTER_LAYER_MWD = 2003,
	/**
	 * 风浪波高-栅格图层
	 */
	RASTER_LAYER_SHWW = 2004,
	/**
	 * 全部标量场(WVE,MWP,SHWW)
	 */
	RASTER_LAYER_ALL_SCALAR = 9998,
	/**
	 * 全部矢量场(MWD)
	 */
	RASTER_LAYER_ALL_VECTOR = 9997,
}

/**
 * @description 风暴潮 layer 枚举
 * @author evaseemefly
 * @date 2023/07/12
 * @export
 * @enum {number}
 */
export enum SurgeLayerEnum {
	/**
	 *	最大增水场 72 h
	 */
	RASTER_LAYER_MAX_SURGE_72 = 3010,
}

export enum SurgeProLayerEnum {
	// UN_LAYER = -1,
	RASTER_PRO_SURGE_LAYER_GT05 = 1301, // 风暴增水概率
	RASTER_PRO_SURGE_LAYER_GT10 = 1302, //  增水大于0.5m的概率 nc
	RASTER_PRO_SURGE_LAYER_GT15 = 1303,
	RASTER_PRO_SURGE_LAYER_GT20 = 1304,
	RASTER_PRO_SURGE_LAYER_GT25 = 1305,
	RASTER_PRO_SURGE_LAYER_GT30 = 1306,
}

/**
 *+ 21-08-23 切换底图的key
 *
 * @export
 * @enum {number}
 */
export enum MapLayerEnum {
	/** 卫星卫片 */
	SATELITE_MAP = 4001, //
	/** 简单底图 */
	SIMPLE_MAP = 4002, //
}

/**
 * + 22-06-08 栅格图层切换 key : 等值线|栅格图层
 *
 * @export
 * @enum {number}
 */
export enum RasterLayerEnum {
	/**
	 * 栅格图层
	 */
	RASTER_LAYER = 4003,

	/**
	 * 等值线图层
	 */
	ISOSURFACE_LAYER = 4004,
}
export const LayerTypeEnum = {
	...SurgeProLayerEnum,
	...BaseLayerTypeEnum,
	...StationIconLayerEnum,
	...ConstLayerTypeEnum,
}
export type LayerTypeEnum =
	| BaseLayerTypeEnum
	| SurgeProLayerEnum
	| ConstLayerTypeEnum
	| StationIconLayerEnum
// export { LayerTypeEnum&SurgeProLayerEnum }
// export default { ...SurgeProLayerEnum, ...LayerTypeEnum }
// export { LayerTypeEnum }
// export { LayerTypeEnum }
