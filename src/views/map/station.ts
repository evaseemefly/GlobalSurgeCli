import {
	IconFormStationDetialedMidModel,
	IconFormDefaultMidModel,
	IconFormMinStationSurgeMidModel,
	IconFormTitleStationSurgeMidModel,
	StationBaseInfoMidModel,
} from '@/middle_model/station'

import { IToHtml } from '@/interface/leaflet_icon'
import { loadStationBaseInfoList, loadInlandStationList } from '@/api/station'
import { IHttpResponse } from '@/interface/common'
/*
 + 21-05-14 
    台风相关的逻辑代码
*/

class StationSurge {
	tyCode: string
	timeStampStr: string
	forecastDt: Date
	stationName: string
	stationCode: string
	// stationIcons: IconFormStationDetialedMidModel[] = []

	constructor(
		stationName: string,
		stationCode: string,
		tyCode: string,
		timeStampStr: string,
		forecastDt: Date
	) {
		this.stationName = stationName
		this.stationCode = stationCode
		this.tyCode = tyCode
		this.timeStampStr = timeStampStr
		this.forecastDt = forecastDt
	}

	/**
	 * 根据传入的 zoom 返回对应的 icon 实现类
	 *
	 * @param {number} zoom
	 * @memberof StationSurge
	 */
	private getStationIconImplements(
		zoom: number,
		options: {
			stationName: string
			stationCode: string
			surgeMax?: number
			surgeMin?: number
			surgeVal: number
			isChecked?: boolean
		}
	): IToHtml {
		// const stationIcons: IconFormStationDetialedMidModel[] = []
		// 若放大的倍数大于五，则返回 详细的 station icon
		let iToHtml = new IconFormDefaultMidModel()
		const that = this
		if (zoom > 10) {
			iToHtml = new IconFormStationDetialedMidModel(
				options.stationName,
				options.stationCode,
				options.surgeVal,
				options.surgeMax,
				options.surgeMin
			)
		} else if (zoom === 10) {
			iToHtml = new IconFormMinStationSurgeMidModel(
				that.stationName,
				that.stationCode,
				options.surgeVal
			)
		} else {
			// zoom <10
			iToHtml = new IconFormTitleStationSurgeMidModel(
				that.stationName,
				that.stationCode,
				options.surgeVal
			)
		}
		return iToHtml
	}
	// private getStationIcon(zoom: number) {
	//     const stationIcons: IconFormStationDetialedMidModel[] = []
	//     // 若放大的倍数大于五，则返回 详细的 station icon
	//     if (zoom >= 5) {
	//         getStationSurgeRangeListByGroupPath(
	//             this.tyCode,
	//             this.forecastDt,
	//             this.timeStampStr
	//         ).then(
	//             (res: {
	//                 status: number
	//                 data: { station_code: string; surge__max: number; surge__min: number }[]
	//             }) => {
	//                 if (res.status === 200) {
	//                     if (res.data.length > 0) {
	//                         res.data.forEach((temp) => {
	//                             stationIcons.push(
	//                                 new IconFormStationDetialedMidModel(
	//                                     temp.station_code,
	//                                     temp.surge__max,
	//                                     temp.surge__min
	//                                 )
	//                             )
	//                         })
	//                         this.stationIcons = stationIcons
	//                     }
	//                 }
	//             }
	//         )
	//     }
	// }

	getImplements(
		zoom: number,
		options: {
			stationName: string
			stationCode: string
			surgeMax: number
			surgeMin: number
			surgeVal: number
		}
	): IToHtml {
		return this.getStationIconImplements(zoom, options)
	}
}

/**
 * @description 全球潮位站基础信息
 * @author evaseemefly
 * @date 2023/03/28
 * @class StationBaseInfo
 */
class StationBaseInfo {
	/**
	 * @description 全部的海洋站基础信息集合
	 * @author evaseemefly
	 * @date 2023/03/28
	 * @type {StationBaseInfoMidModel[]}
	 * @memberof StationBaseInfo
	 */
	allStationBaseInfoList: StationBaseInfoMidModel[] = []

	/**
	 * @description 加载全部站点的基础信息 -> this.allStationBaseInfoList
	 * @author evaseemefly
	 * @date 2023/03/28
	 * @returns {*}  {Promise<void>}
	 * @memberof StationBaseInfo
	 */
	async getAllStationInfo(): Promise<void> {
		const that = this
		await loadStationBaseInfoList().then(
			(
				res: IHttpResponse<
					{
						station_code: string
						station_name: string
						lat: number
						lon: number
						rid: number
					}[]
				>
			) => {
				if (res.status === 200) {
					this.allStationBaseInfoList = []
					res.data.forEach((element) => {
						that.allStationBaseInfoList.push(
							new StationBaseInfoMidModel(
								element.rid,
								element.station_code,
								element.station_name,
								element.lat,
								element.lon
							)
						)
					})
				}
			}
		)
	}

	/**
	 * @description 获取全部国内的站点基础信息集合
	 * @author evaseemefly
	 * @date 2023/07/12
	 * @returns {*}  {Promise<void>}
	 * @memberof StationBaseInfo
	 */
	async getAllInlandStationInfo(): Promise<void> {
		const that = this
		await loadInlandStationList().then(
			(
				res: IHttpResponse<
					{
						code: string
						name: string
						lat: number
						lon: number
						rid: number
					}[]
				>
			) => {
				if (res.status === 200) {
					this.allStationBaseInfoList = []
					res.data.forEach((element) => {
						that.allStationBaseInfoList.push(
							new StationBaseInfoMidModel(
								element.rid,
								element.code,
								element.name,
								element.lat,
								element.lon
							)
						)
					})
				}
			}
		)
	}
}

export { StationSurge, StationBaseInfo, IToHtml }
