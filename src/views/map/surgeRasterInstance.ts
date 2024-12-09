import moment from 'moment'
import {
	loadGlobalHourlyCoverageTif,
	loadGlobalSurgeMaxCoverageTif,
	loadMaxSurgeCoverageInfoByIssue,
	loadMaxSurgeCoverageTifUlrByIssue,
} from '@/api/raster'
import { ForecastAreaEnum, LayerTypeEnum } from '@/enum/map'
import { TifInfoType } from './types/types'
import { IHttpResponse } from '@/interface/common'
import { MS_UNIT } from '@/const/unit'
import { RasterFileEnum } from '@/enum/common'

export interface IRasterTif<T> {
	getGeoTifUrl(forecastDt: Date): Promise<T>
}

abstract class AbsSurgeRasterTifLayer<T> implements IRasterTif<T> {
	/** 发布时间戳(str) */
	issueTimestamp: string
	// forecastDt: Date
	/** layer类型 */
	layerType: LayerTypeEnum

	/** 预报区域——默认为西北太 */
	area: ForecastAreaEnum
	constructor(
		issueTimestamp: string,
		layerType: LayerTypeEnum,
		area: ForecastAreaEnum = ForecastAreaEnum.WNP
	) {
		this.issueTimestamp = issueTimestamp
		this.layerType = layerType
		this.area = area
	}

	abstract getGeoTifUrl(forecastDt: Date): Promise<T>
}

/**
 * + 24-11-04 风暴潮增水场标量场 tif 图层
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
		// const tifUrl = null
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

/**
 * @description 风暴潮逐时增水场
 * @author evaseemefly
 * @date 2024/11/04
 * @class SurgeHourlyScalarRasterLayer
 * @extends {AbsSurgeRasterTifLayer<T>}
 * @template T
 */
class SurgeHourlyScalarRasterLayer<T> extends AbsSurgeRasterTifLayer<T> {
	/**
	 * @description 逐时风暴增水场 raster layer
	 * @author evaseemefly
	 * @date 2024/11/04
	 * @param {Date} forecastDt
	 * @returns {*}  {Promise<T>}
	 * @memberof SurgeHourlyScalarRasterLayer
	 */
	getGeoTifUrl(forecastDt: Date): Promise<T> {
		// const tifUrl = null
		try {
			/** 预报时间戳(s) */
			const forecastTsByS: number = forecastDt.getTime()
			const issueTs: number = parseInt(this.issueTimestamp)
			const area: ForecastAreaEnum = this.area

			return loadGlobalHourlyCoverageTif(
				area,
				issueTs,
				forecastTsByS,
				RasterFileEnum.GEOTIFF
			).then((res) => {
				if (res.status == 200) {
					console.log(`加载geotiff文件:${res.data}成功!`)
					return res.data
				}
			})
		} catch (error) {
			console.log(error)
		}
	}
}

class SurgeMaxScalarRasterLayer<T> extends AbsSurgeRasterTifLayer<T> {
	/**
	 * @description 逐时风暴增水场 raster layer
	 * @author evaseemefly
	 * @date 2024/11/04
	 * @param {Date} forecastDt- 不使用
	 * @returns {*}  {Promise<T>}
	 * @memberof SurgeHourlyScalarRasterLayer
	 */
	getGeoTifUrl(forecastDt: Date): Promise<T> {
		// const tifUrl = null
		try {
			/** 预报时间戳(s) */
			const forecastTsByS: number = forecastDt.getTime()
			const issueTs: number = parseInt(this.issueTimestamp)
			const area: ForecastAreaEnum = this.area

			return loadGlobalSurgeMaxCoverageTif(area, issueTs, RasterFileEnum.GEOTIFF).then(
				(res) => {
					if (res.status == 200) {
						console.log(`加载geotiff文件:${res.data}成功!`)
						return res.data
					}
				}
			)
		} catch (error) {
			console.log(error)
		}
	}
}

export {
	AbsSurgeRasterTifLayer,
	SurgeMaxScalarRasterTifLayer,
	SurgeHourlyScalarRasterLayer,
	SurgeMaxScalarRasterLayer,
}
