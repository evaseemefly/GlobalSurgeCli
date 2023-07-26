import axios, { AxiosResponse } from 'axios'
import { host } from '../common'
import authHeader from '../auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

// TODO:[*] 23-07-19 此处需要按照网关配置进行相应修改
const area = '/station'

/**
 * + 23-07-19
 * 获取指定 code 的站点的 >= start , <=end 时间范围的预报surge list
 * @param code
 * @param issue 预报发布时间戳
 * @param start 起始时间戳
 * @param end 结束时间戳
 * @returns
 */
const loadTargetStationSurgeForecastList = (
	code: string,
	issue: number,
	start: number,
	end: number
) => {
	const url = `${host}${area}/surge/list`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, issue_ts: issue, start_ts: start, end_ts: end },
	})
}

/**
 * 获取单站四色警戒潮位
 * @param code
 * @returns [{
        "station_code": "BHI",
        "tide": 526.0,
        "alert": 5001
    },]
 */
const loadInLandAlertLevels = (code: string) => {
	const url = `${host}${area}/alert/one`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code },
	})
}

export { loadTargetStationSurgeForecastList, loadInLandAlertLevels }
