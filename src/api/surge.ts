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

export { loadSurgeListByRecently }
