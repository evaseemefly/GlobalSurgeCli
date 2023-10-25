import moment from 'moment'
import { loadMaxSurgeCoverageInfoByIssue, loadMaxSurgeCoverageTifUlrByIssue } from '@/api/raster'
import { LayerTypeEnum } from '@/enum/map'
import { TifInfoType } from './types/types'
import { IHttpResponse } from '@/interface/common'
import { MS_UNIT } from '@/const/unit'

export interface IRasterTif<T> {
	getGeoTifUrl(forecastDt: Date): Promise<T>
}

abstract class AbsSurgeRasterTifLayer<T> implements IRasterTif<T> {
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
class SurgeMaxScalarRasterTifLayer<T> extends AbsSurgeRasterTifLayer<T> {
	/**
	 * - 22-06-11 注意此处存在一个bug若请求出现异常则会返回 '' 注意!
	 *
	 * @param {string} tyCode
	 * @param {string} tyTimeStamp
	 * @return {*}
	 * @memberof MaxSurge
	 */
	async getGeoTifUrl(forecastDt: Date): Promise<T> {
		const tifUrl = null
		try {
			// 此处不使用异步
			// // eg : {relative_path: '2022/01/01', file_name: 'global_ecmwf_det_wve_2022010112_18.tif', file_size: 8116.333984375}
			// http://localhost:82/images/WAVE/2022/01/01/
			/** 预报时间戳(s) */
			const forecastTsByS: number = forecastDt.getTime() / MS_UNIT
			/**
             * {
                "forecast_ts": 1685620800,
                "issue_ts": 1685620800,
                "task_id": 39268281,
                "relative_path": "2023/06",
                "file_name": "NMF_TRN_OSTZSS_CSDT_2023060112_168h_SS_maxSurge.nc",
                "coverage_type": 2102
            }
             */
			return loadMaxSurgeCoverageTifUlrByIssue(forecastTsByS).then(
				(res: IHttpResponse<T>) => {
					if (res.status === 200) {
						return res.data
					}
				}
			)
			// const tifResp = await loadMaxSurgeCoverageInfoByIssue(forecastTs)

			// tifUrl = tifResp.data.remote_url
		} catch (error) {
			console.log(error)
		}

		// return tifUrl
	}
}

export { AbsSurgeRasterTifLayer, SurgeMaxScalarRasterTifLayer }
