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

/**
 * + 23-07-21 获取国内站点的天文潮集合
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadInLandAstronomictideList = (code: string, start: number, end: number) => {
	const url = `${host}${area}/surge/astronomictide/list`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_ts: start, end_ts: end },
	})
}

/**
 * 获取国内所有站点的 [start,end] issueTs 发布的总潮位集合
 * @param startTs
 * @param endTs
 * @param issueTs
 * @returns
 */
const loadInLandDistStationTotalSurgeList = (startTs: number, endTs: number, issueTs: number) => {
	const url = `${host}${area}/dist/stations/totalsurge`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs, issue_ts: issueTs },
	})
}

export {
	loadSurgeListByRecently,
	loadTargetStationSurgeRealdataList,
	loadTargetStationTideRealdataList,
	loadInLandAstronomictideList,
	loadInLandDistStationTotalSurgeList,
}
