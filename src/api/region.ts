import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/region'

/**
 * 获取全部国家的总数
 * @returns
 */
const loadAllCountryCount = () => {
	const url = `${host}${area}/all/country/count`
	return axios.get(url, {
		headers: authHeader(),
	})
}

/**
 * 加载指定pid的所有地区
 * @param pid
 * @returns
 */
const loadRegionListByPid = (pid?: number) => {
	const url = `${host}${area}/list`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			pid: pid,
		},
	})
}

export { loadAllCountryCount, loadRegionListByPid }
