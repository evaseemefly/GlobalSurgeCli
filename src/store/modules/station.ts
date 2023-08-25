import { StationBaseInfoMidModel } from '@/middle_model/station'
import {
	SET_STATION_CODE,
	GET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_SHOW_STATION_SURGE_FORM,
	SET_REGION_PID,
	GET_REGION_PID,
	SET_STATIONS_BASEINFO_LIST,
	GET_STATIONS_BASEINFO_LIST,
} from '../types'
import { DEFAULT_STATION_CODE } from '@/const/default'
interface IStation {
	stationCode: string
	isShowStationSurgeForm: boolean
	regionPid: number
	/** 海洋站基础信息集合 */
	stationBaseInfoList: StationBaseInfoMidModel[]
}

const state: IStation = {
	stationCode: DEFAULT_STATION_CODE,
	isShowStationSurgeForm: false,
	regionPid: -1,
	/** 海洋站基础信息集合 */
	stationBaseInfoList: [],
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
	[GET_STATIONS_BASEINFO_LIST](state: IStation): StationBaseInfoMidModel[] {
		return state.stationBaseInfoList
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
	[SET_STATIONS_BASEINFO_LIST](state: IStation, val: StationBaseInfoMidModel[]): void {
		state.stationBaseInfoList = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
