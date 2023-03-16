import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/geo'

/**
 * 根据图层种类获取对应的最近产品发布信息
 * @param layerType 产品图层种类
 * @returns {
                "gmt_forecast_issue": "2022-01-01T12:00:00Z",
                "gmt_forecast_issue_timestamp": 1641038400
            }
 */
const loadRecentWaveProductIssus = (layerType: LayerTypeEnum) => {
	const url = `${host}${area}/coverage/issue/date/recent/`
	return axios.get(url, {
		headers: authHeader(),
		params: { coverage_type: layerType },
	})
}

/**
 * + 22-12-30 获取最近一次的发布的预报时间范围
 * @param layerType
 * @returns {
				"gmt_forecast_start": "2022-01-01T12:00:00Z",
				"gmt_forecast_end": "2022-01-03T05:00:00Z"
			}
 */
const loadRecentCoverageDateRange = (layerType: LayerTypeEnum) => {
	const url = `${host}${area}/coverage/recent/date/range/`
	return axios.get(url, {
		headers: authHeader(),
		params: { coverage_type: layerType },
	})
}

/**
 * + 23-01-04 获取海洋指定产品的tif相关信息
 * @param layerType
 * @param issueTimestamp
 * @param forecastDt
 * @returns
 */
const loadWaveProductTifInfo = (
	layerType: LayerTypeEnum,
	issueTimestamp: string,
	forecastDt: Date
) => {
	const url = `${host}${area}/coverage/wave/tif/info/`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			coverage_type: layerType,
			issue_timestamp: issueTimestamp,
			forecast_dt: forecastDt,
		},
	})
}

/**
 * 加载对应位置的时序数据
 * @param layerType 产品种类
 * @param issueTimestamp 发布时间戳
 * @param latlng 经纬度
 * @returns
 */
const loadWaveProductForecastRealDataList = (
	layerType: LayerTypeEnum,
	issueTimestamp: string,
	latlng: L.LatLng
) => {
	const url = `${host}${area}/coverage/wave/realdata/list/`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			coverage_type: layerType,
			issue_timestamp: issueTimestamp,
			latlng: [latlng.lat, latlng.lng],
		},
	})
}

/**
 * 加载海浪浪向产品集合
 * @param layerType
 * @param issueTimestamp
 * @param forecastTimestamp
 * @returns 
 * {
    "unit": 1.0,
    "step": 4,
    "forecast_timestamp": 1641038400,
    "issue_timestamp": 1641038400,
    "coverage_type": 2003,
    "forecast_area": 1,
    "list_wave_dir": [
        {
            "wave_dir": 354,
            "coords": {
                "type": "Point",
                "coordinates": [
                    50,
                    142
                ]
            }
        },
	]
	}
 */
const loadWaveDirProductList = (
	layerType: LayerTypeEnum,
	issueTimestamp: string,
	forecastTimestamp: string
) => {
	const url = `${host}${area}/wave/dir/bar/`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			coverage_type: layerType,
			issue_timestamp: issueTimestamp,
			forecast_timestamp: forecastTimestamp,
		},
	})
}

export {
	loadRecentWaveProductIssus,
	loadRecentCoverageDateRange,
	loadWaveProductTifInfo,
	loadWaveProductForecastRealDataList,
	loadWaveDirProductList,
}
