import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/coverage'

/**
 * 根据取72小时最大增水场对应发布时间的 coverage info
 * @param layerType 产品图层种类
 * @returns {
    "forecast_ts": 1685620800,
    "issue_ts": 1685620800,
    "task_id": 39268281,
    "relative_path": "2023/06",
    "file_name": "NMF_TRN_OSTZSS_CSDT_2023060112_168h_SS_maxSurge.nc",
    "coverage_type": 2102
}
 */
const loadMaxSurgeCoverageInfoByIssue = (issueTs: number) => {
	const url = `${host}${area}/one/info/ts`
	return axios.get(url, {
		headers: authHeader(),
		params: { issue_ts: issueTs },
	})
}

const loadMaxSurgeCoverageTifUlrByIssue = (issueTs: number) => {
	const url = `${host}${area}/one/url/ts`
	return axios.get(url, {
		headers: authHeader(),
		params: { issue_ts: issueTs },
	})
}

export { loadMaxSurgeCoverageInfoByIssue, loadMaxSurgeCoverageTifUlrByIssue }
