import { loadWaveProductTifInfo } from '@/api/wave'
import { LayerTypeEnum } from '@/enum/map'
import { TifInfoType } from './types/types'

export interface IRasterTif<T> {
	getGeoTifUrl(forecastDt: Date): Promise<T>
}

abstract class WaveRasterTifLayer<T> implements IRasterTif<T> {
	issueTimestamp: string
	// forecastDt: Date
	layerType: LayerTypeEnum
	constructor(issueTimestamp: string, layerType: LayerTypeEnum) {
		this.issueTimestamp = issueTimestamp
		this.layerType = layerType
	}

	abstract getGeoTifUrl(forecastDt: Date): Promise<T>
}

/**
 * + 23-01-04 海浪标量场 tif 图层
 */
class WaveScalarRasterTifLayer<T> extends WaveRasterTifLayer<T> {
	/**
	 * - 22-06-11 注意此处存在一个bug若请求出现异常则会返回 '' 注意!
	 *
	 * @param {string} tyCode
	 * @param {string} tyTimeStamp
	 * @return {*}
	 * @memberof MaxSurge
	 */
	async getGeoTifUrl(forecastDt: Date): Promise<T> {
		let tifUrl = null
		try {
			// 此处不使用异步
			// // eg : {relative_path: '2022/01/01', file_name: 'global_ecmwf_det_wve_2022010112_18.tif', file_size: 8116.333984375}
			// http://localhost:82/images/WAVE/2022/01/01/
			const tifResp = await loadWaveProductTifInfo(
				this.layerType,
				this.issueTimestamp,
				forecastDt
			)
			tifUrl = tifResp.data
		} catch (error) {
			console.log(error)
		}

		return tifUrl
	}
}

export { WaveRasterTifLayer, WaveScalarRasterTifLayer }
