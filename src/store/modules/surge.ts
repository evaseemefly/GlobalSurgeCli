import {
	SET_SURGE_FORECAST_AREA,
	GET_SURGE_FORECAST_AREA,
	GET_GLOBAL_SURGE_FORECAST_TS,
	SET_GLOBAL_SURGE_FORECAST_TS,
	GET_GLOBAL_SURGE_ISSUE_TS,
	SET_GLOBAL_SURGE_ISSUE_TS,
	GET_GLOBAL_SURGE_FORECAST_PRODUCT,
	SET_GLOBAL_SURGE_FORECAST_PRODUCT,
} from '../types'
import { DEFAULT_DATE, DEFAULT_TIMESTAMP } from '@/const/default'
import { ForecastAreaEnum, LayerTypeEnum } from '@/enum/map'
import { ForecastProductTypeEnum } from '@/enum/surge'
interface ISurgeOpts {
	/** 预报产品发布时间 */
	forecastArea: ForecastAreaEnum
	/** 全球风暴潮预报时间戳 */
	forecastTs: number
	/** 最大增水场|逐时增水场 */
	forecastProduct: ForecastProductTypeEnum
	/** 预报产品发布时间 */
	issueTs: number
}

const state: ISurgeOpts = {
	forecastArea: ForecastAreaEnum.NONE,
	forecastTs: DEFAULT_TIMESTAMP,
	forecastProduct: ForecastProductTypeEnum.SURGE_MAX,
	/** 预报产品发布时间 */
	issueTs: DEFAULT_TIMESTAMP,
}
const getters = {
	[GET_SURGE_FORECAST_AREA](state: ISurgeOpts): ForecastAreaEnum {
		return state.forecastArea
	},
	[GET_GLOBAL_SURGE_FORECAST_TS](state: ISurgeOpts): number {
		return state.forecastTs
	},
	[GET_GLOBAL_SURGE_ISSUE_TS](state: ISurgeOpts): number {
		return state.issueTs
	},
	[GET_GLOBAL_SURGE_FORECAST_PRODUCT](state: ISurgeOpts): ForecastProductTypeEnum {
		return state.forecastProduct
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_SURGE_FORECAST_AREA](state: ISurgeOpts, val: ForecastAreaEnum): void {
		state.forecastArea = val
	},
	[SET_GLOBAL_SURGE_FORECAST_TS](state: ISurgeOpts, val: number): void {
		state.forecastTs = val
	},
	[SET_GLOBAL_SURGE_ISSUE_TS](state: ISurgeOpts, val: number): void {
		state.issueTs = val
	},
	[SET_GLOBAL_SURGE_FORECAST_PRODUCT](state: ISurgeOpts, val: ForecastProductTypeEnum): void {
		state.forecastProduct = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
