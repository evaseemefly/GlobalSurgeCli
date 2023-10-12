import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/coverage'

/**
 * + 23-10-10
 * 加载指定位置的矢量预报数据
 * @param layerType 产品图层种类
 * @returns {
    [
        {
            "forecast_ts": 1696766400,
            "wd": 152.70323181152344,
            "ws": 0.5863919258117676
        },
    ]); 
}
 */
const loadVectorForecastListByPoint = (issueTs: number, lat: number, lon: number) => {
	const url = `${host}${area}/forecast/point/list`
	return axios.get(url, {
		headers: authHeader(),
		params: { issue_ts: issueTs, lat: lat, lon: lon },
	})
}

export { loadVectorForecastListByPoint }
