import axios, { AxiosResponse } from 'axios'
import * as L from 'leaflet'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/coverage'

/** TODO:[-] 24-12-05
 * 获取指定经纬度(站点)的预报时序数据
 * 后台判断提供经纬度所在预报区域
 *
 */
const loadTargetPositionSurgeForecastdataList = (
	position: L.LatLng,
	issueTs: number,
	startTs: number,
	endTs: number
) => {
	const url = `${host}${area}/position/forecast/surge/list`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			lat: position.lat,
			lon: position.lng,
			issue_ts: issueTs,
			start_ts: startTs,
			end_ts: endTs,
		},
	})
}

export { loadTargetPositionSurgeForecastdataList }
