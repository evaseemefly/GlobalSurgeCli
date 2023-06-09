import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/station'

/**
 * 获取所有潮位站距离当前最近的潮值
 * @param now
 * @returns
 */
const loadSurgeListByRecently = (now: Date) => {
	const url = `${host}${area}/surge/list/recent`
	return axios.get(url, {
		headers: authHeader(),
		params: { now: now },
	})
}

/**
 * 获取指定 code 的站点的 >= start , <=end 时间范围的surge list
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadTargetStationSurgeRealdataList = (code: string, start: Date, end: Date) => {
	const url = `${host}${area}/surge/one/`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_dt: start, end_dt: end },
	})
}

/**
 * 获取单站的天文潮位
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadTargetStationTideRealdataList = (code: string, start: Date, end: Date) => {
	const url = `${host}${area}/tide/one/`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_dt: start, end_dt: end },
	})
}

export {
	loadSurgeListByRecently,
	loadTargetStationSurgeRealdataList,
	loadTargetStationTideRealdataList,
}
