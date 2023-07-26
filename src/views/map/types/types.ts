import { LayerTypeEnum, RasterLayerEnum } from '@/enum/map'

/**
 *tif store info 类型
 */
interface TifInfoType {
	relative_path: string
	file_name: string
}

/**
 * + 21-08-19
 *   色标接口 *
 * @export
 * @interface IScale
 */
export interface IScale {
	scaleList: string[] | string
}

/**
 * + 潮位图层接口
 *   台风编号
 *   时间戳
 * @export
 * @interface ISurgeLayer
 */
export interface ISurgeLayer {
	tyCode: string
	tyTimeStamp: string
}

/**
 * layer 显示参数
 *
 * @export
 * @interface ILayerDisplayOptions
 */
export interface ILayerDisplayOptions {
	isShow: boolean
	layerType: LayerTypeEnum
}

/**
 * @description 栅格图层接口
 * @author evaseemefly
 * @date 2023/07/26
 * @export
 * @interface IRasterLayer
 * @extends {ILayerDisplayOptions}
 * @extends {ISurgeLayer}
 * @extends {IScale}
 */
export interface IRasterLayer extends ILayerDisplayOptions, ISurgeLayer, IScale {
	rasterLayerType: RasterLayerEnum
}

/**
 * 温带风暴潮增水配置接口
 *
 * @export
 * @interface ITySurgeOptions
 * @extends {ILayerDisplayOptions}
 * @extends {ISurgeLayer}
 */
export interface IWdSurgeLayerOptions extends IRasterLayer {
	forecastDt: Date
}
export { TifInfoType }
