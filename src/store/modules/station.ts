import {
	SET_STATION_CODE,
	GET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_SHOW_STATION_SURGE_FORM,
} from '../types'
import { DEFAULT_STATION_CODE } from '@/const/default'
interface IStation {
	stationCode: string
	isShowStationSurgeForm: boolean
}

const state: IStation = {
	stationCode: DEFAULT_STATION_CODE,
	isShowStationSurgeForm: false,
}
const getters = {
	[GET_STATION_CODE](state: IStation): string {
		return state.stationCode
	},
	[GET_SHOW_STATION_SURGE_FORM](state: IStation): boolean {
		return state.isShowStationSurgeForm
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_STATION_CODE](state: IStation, val: string): void {
		state.stationCode = val
	},
	[SET_SHOW_STATION_SURGE_FORM](state: IStation, val: boolean): void {
		state.isShowStationSurgeForm = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
