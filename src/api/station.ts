import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/station'

/**
 * 获取指定站点的过程增水集合
 * @param params
 * @returns
 */
const loadStationDetailDataList = (params: ITyphoonParams4Station) => {
	const url = `${host}${area}/data/detaillist/`
	return axios.get(url, {
		headers: authHeader(),
		params: params,
	})
}

/**
 * 根据 tyNum 获取该过程的海洋站增水极值集合
 *
 * @param tyNum 台风编号
 * @returns
 */
const loadStationExtremumDataList = (tyNum: string) => {
	const url = `${host}${area}/data/station/extremum/list/`
	return axios.get(url, {
		headers: authHeader(),
		params: { num: tyNum },
	})
}

/**
 * + 22-12-06 根据 tyNum 获取该过程的海洋站实况极值集合
 * {max_date: "2012-08-05T16:00:00Z"
   max_val: 实况增水极值
   realdata_val: 实况增水极值
   station_code: "AOJIANG"
   tide_val: 天文潮}[]
 * @param tyNum 台风编号
 * @returns 
 */
const loadStationExtremumRealDataist = (tyNum: string) => {
	const url = `${host}${area}/data/station/extremum/realdata/list/`
	return axios.get(url, {
		headers: authHeader(),
		params: { num: tyNum },
	})
}

/**
 * 根据 codes(station) 获取该站点的四色警戒潮位信息
 * @param codes
 * @returns
 */
const loadStationAlertLevelDataList = (
	codes: string[]
): Promise<
	AxiosResponse<
		{
			code: string
			name_en: string
			alerts: { code: string; alert: number; tide: number }[]
		}[]
	>
> => {
	const url = `${host}${area}/data/station/alert/list/`
	return axios.get(url, {
		headers: authHeader(),
		params: { codes: codes },
	})
}

/**
 * 获取海洋站中英文字典
 * @returns  [{
        "name": "AOJIANG",
        "chname": "鳌江"
    },]
 */
const loadStationNameDict = () => {
	const url = `${host}${area}/dict/station_ch/`
	return axios.get(url, {
		headers: authHeader(),
		params: {},
	})
}

/**
 * - 23-03-28 获取潮位站基础信息集合
 * @returns [
 * 	{
    "station_code": "hana",
    "station_name": "DEFAULT",
    "lat": 43.28,
    "lon": 145.57,
    "rid": 112
  	},
 * ]
 */
const loadStationBaseInfoList = () => {
	const url = `${host}${area}/base/list`
	return axios.get(url, {
		headers: authHeader(),
	})
}

/**
 * + 23-04-03 获取指定站点的状态
 * @param code 站点 code
 * @returns{
 * {
	"id": 673,
	"station_code": "cbmd",
	"status": 1001,
	"tid": 51,
	"is_del": false,
	"gmt_realtime": "2023-03-03T07:18:00"
	}
 * }
 */
const loadStationStaus = (code: string) => {
	const url = `${host}${area}/status/one/`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code },
	})
}

/**
 * + 23-04-04 获取全部站点的状态
 * @returns
 * {
		"id": 1,
		"station_code": "abed",
		"status": 1001,
		"tid": 528,
		"is_del": false,
		"gmt_realtime": "2023-04-02T13:45:00"
	},
 */
const loadAllStationStatus = () => {
	const url = `${host}${area}/status/all`
	return axios.get(url, {
		headers: authHeader(),
	})
}

const loadStationStatusByPid = (pid: number) => {
	const url = `${host}${area}/status/all/station_status/pid/`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			pid: pid,
		},
	})
}

/**
 * +23-04-04 获取所有站点的状态及geo信息(包含surge默认值)
 * @returns
 * {
      "station_code": "waka",
      "status": 1001,
      "gmt_realtime": "2023-04-02T19:29:00",
      "gmt_modify_time": "2023-04-02T19:44:25.022726",
      "is_del": false,
      "lat": 45.41,
      "lon": 141.69,
      "rid": 110,
      "surge": -9999.99
   },
 */
const loadAllStationStatusJoinGeoInfo = (pid?: number) => {
	const url = `${host}${area}/status/all/latlng`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			pid: pid,
		},
	})
}

/**
 *
 * @param code
 * @returns
 */
const loadStaionRegionCountry = (code: string) => {
	const url = `${host}${area}/base/contain/region/`
	return axios.get(url, {
		headers: authHeader(),
		params: { code: code },
	})
}

export {
	loadStationDetailDataList,
	loadStationExtremumDataList,
	loadStationNameDict,
	loadStationAlertLevelDataList,
	loadStationExtremumRealDataist,
	loadStationBaseInfoList,
	loadStationStaus,
	loadAllStationStatus,
	loadStationStatusByPid,
	loadAllStationStatusJoinGeoInfo,
	loadStaionRegionCountry,
}
