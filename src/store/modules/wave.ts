import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	SET_WAVE_PRODUCT_LAYER_TYPE,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	GET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
} from '../types'
import { DEFAULT_DATE, DEFAULT_TIMESTAMP } from '@/const/default'
import { LayerTypeEnum } from '@/enum/map'
interface IWaveOpts {
	/** 预报产品发布时间 */
	issueDatetime: Date
	issueTimestamp: number
	/** 当前预报时间 */
	forecastDatetime: Date
	/** 预报产品种类 */
	productType: LayerTypeEnum
}

const state: IWaveOpts = {
	issueDatetime: DEFAULT_DATE,
	issueTimestamp: DEFAULT_TIMESTAMP,
	forecastDatetime: DEFAULT_DATE,
	productType: LayerTypeEnum.UN_LAYER,
}
const getters = {
	[GET_WAVE_PRODUCT_ISSUE_DATETIME](state: IWaveOpts): Date {
		return state.issueDatetime
	},
	[GET_WAVE_PRODUCT_ISSUE_TIMESTAMP](state: IWaveOpts): number {
		return state.issueTimestamp
	},
	[GET_WAVE_PRODUCT_LAYER_TYPE](state: IWaveOpts): LayerTypeEnum {
		return state.productType
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_WAVE_PRODUCT_ISSUE_DATETIME](state: IWaveOpts, val: Date): void {
		state.issueDatetime = val
	},
	[SET_WAVE_PRODUCT_ISSUE_TIMESTAMP](state: IWaveOpts, val: number): void {
		state.issueTimestamp = val
	},
	[SET_WAVE_PRODUCT_LAYER_TYPE](state: IWaveOpts, val: LayerTypeEnum): void {
		state.productType = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
