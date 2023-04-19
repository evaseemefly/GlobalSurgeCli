import {
	SET_STATION_CODE,
	GET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_SHOW_STATION_SURGE_FORM,
	SET_REGION_PID,
	GET_REGION_PID,
} from '../types'
import { DEFAULT_STATION_CODE } from '@/const/default'
interface IStation {
	stationCode: string
	isShowStationSurgeForm: boolean
	regionPid: number
}

const state: IStation = {
	stationCode: DEFAULT_STATION_CODE,
	isShowStationSurgeForm: false,
	regionPid: -1,
}
const getters = {
	[GET_STATION_CODE](state: IStation): string {
		return state.stationCode
	},
	[GET_SHOW_STATION_SURGE_FORM](state: IStation): boolean {
		return state.isShowStationSurgeForm
	},
	[GET_REGION_PID](state: IStation): number {
		return state.regionPid
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
	[SET_REGION_PID](state: IStation, val: number): void {
		state.regionPid = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
