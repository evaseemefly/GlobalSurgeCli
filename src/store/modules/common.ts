import {
	SET_PRODUCT_TYPE,
	GET_PRODUCT_TYPE,
	SET_SCALE_KEY,
	GET_SCALE_KEY,
	GET_SCALE_RANGE,
	SET_SCALE_RANGE,
	SET_SCALE_DESC,
	GET_SCALE_DESC,
	GET_SHOW_OPTS_FORM,
	SET_SHOW_OPTS_FORM,
	SET_ISOSURGE_COLOR_SCALE_VAL_RANGE,
	GET_ISOSURGE_COLOR_SCALE_VAL_RANGE,
	SET_RASTER_COLOR_SCALE_RANGE,
	GET_RASTER_COLOR_SCALE_RANGE,
	SET_ISOSURGE_COLOR_SCALE_STR_LIST,
	GET_ISOSURGE_COLOR_SCALE_STR_LIST,
	SET_DATE_STEP,
	GET_DATE_STEP,
	SET_SELECTED_LOOP,
	GET_SELECTED_LOOP,
	SET_SHOW_STATION_DETAIL_FORM,
	SET_SHOW_STATION_EXTREMUM_FORM,
	SET_SHOW_TY_SEARCH_FORM,
	GET_SHOW_STATION_DETAIL_FORM,
	GET_SHOW_STATION_EXTREMUM_FORM,
	GET_SHOW_TY_SEARCH_FORM,
	SET_TO_FILTER_TY_SCATTER,
	GET_TO_FILTER_TY_SCATTER,
	GET_SHADE_NAV_TIME,
	SET_SHADE_NAV_TIME,
	SET_CURRENT_FORECAST_DT,
	GET_CURRENT_FORECAST_DT,
	GET_SCALAR_SHOW_TYPE,
	SET_SCALAR_SHOW_TYPE,
	SET_SURGE_TD_STEP,
	GET_SURGE_TD_STEP,
	SET_TIMESPAN,
	GET_TIMESPAN,
	SET_NOW,
	GET_NOW,
	SET_ISSUE_TS,
	GET_ISSUE_TS,
} from '../types'

import { IScale, DEFAULT_COLOR_SCALE } from '@/const/colorBar'

import {
	DEFAULT_DATE,
	DEFAULT_DATE_STEP,
	DEFAULT_SURGE_TD_STEP,
	DEFAULT_TIMESTAMP,
	DEFAULT_TIME_SPAN,
	DEFAULT_WD_TIME_SPAN,
} from '@/const/default'
import { IExpandEnum, ScalarShowTypeEnum } from '@/enum/common'
// import { faL } from '@fortawesome/free-solid-svg-icons'

interface Common {
	scaleRange: number[]
	isoSurgeScaleValRange: number[]
	isoSurgeScaleStrList: string[]
	/**
	 * 栅格图层色标范围
	 * val: 数值
	 * colorstr: 对应色标str
	 */
	rasterScaleRange: IScale
	isShowOptionsForm: boolean
	scaleDesc: string
	step: number
	/**
	 * @description 是否为选择圈选 t:进行圈选 ; f:未进行圈选
	 * @author evaseemefly
	 * @date 2022/10/30
	 * @type {boolean}
	 * @memberof Common
	 */
	isSelectedLoop: boolean
	/** 是否显示台风检索详情窗口 */
	isShowTySearchDetailForm: IExpandEnum
	/** 是否显示海洋站增水详情窗口 */
	isShowStationDetailForm: IExpandEnum
	/** 是否显示台风过程海洋站极值窗口 */
	isShowStationExtremumForm: IExpandEnum
	isToFilterTy4Scatter: boolean
	/** 是否遮罩 time bar */
	isShadeTimeBar: boolean
	currentForecastDt: Date
	/** 标量场显示类型 栅格图层 | 等值线 */
	scalarShowType: ScalarShowTypeEnum
	/** 潮位 table 中的 td 之间的时间间隔(h) */
	surgeTdStep: number
	timeSpan: number
	now: Date
	/** 发布时间戳 */
	issueTs: number
}

const state: Common = {
	scaleRange: [],
	isShowOptionsForm: false,
	isoSurgeScaleStrList: [],
	isoSurgeScaleValRange: [],
	rasterScaleRange: DEFAULT_COLOR_SCALE,
	scaleDesc: '',
	step: DEFAULT_DATE_STEP,
	/** 是否为选择圈选 t:进行圈选 ; f:未进行圈选 */
	isSelectedLoop: false,
	isShowTySearchDetailForm: IExpandEnum.UN_SELECTED,
	isShowStationDetailForm: IExpandEnum.UN_SELECTED,
	isShowStationExtremumForm: IExpandEnum.UN_SELECTED,
	isToFilterTy4Scatter: false,
	isShadeTimeBar: false,
	currentForecastDt: DEFAULT_DATE,
	scalarShowType: ScalarShowTypeEnum.RASTER,
	surgeTdStep: DEFAULT_SURGE_TD_STEP,
	timeSpan: DEFAULT_WD_TIME_SPAN,

	// now: new Date(2023, 3, 2, 23, 0),
	now: new Date(),
	issueTs: DEFAULT_TIMESTAMP,
}
const getters = {
	[GET_SCALE_RANGE](state: Common): number[] {
		return state.scaleRange
	},
	[GET_SHOW_OPTS_FORM](state: Common): boolean {
		return state.isShowOptionsForm
	},
	[GET_ISOSURGE_COLOR_SCALE_VAL_RANGE](state: Common): number[] {
		return state.isoSurgeScaleValRange
	},
	[GET_ISOSURGE_COLOR_SCALE_STR_LIST](state: Common): string[] {
		return state.isoSurgeScaleStrList
	},
	[GET_SCALE_DESC](state: Common): string {
		return state.scaleDesc
	},
	[GET_DATE_STEP](state: Common): number {
		return state.step
	},
	[GET_SELECTED_LOOP](state: Common): boolean {
		return state.isSelectedLoop
	},
	[GET_SHOW_TY_SEARCH_FORM](state: Common): IExpandEnum {
		return state.isShowTySearchDetailForm
	},
	[GET_SHOW_STATION_EXTREMUM_FORM](state: Common): IExpandEnum {
		return state.isShowStationExtremumForm
	},
	[GET_SHOW_STATION_DETAIL_FORM](state: Common): IExpandEnum {
		return state.isShowStationDetailForm
	},
	[GET_TO_FILTER_TY_SCATTER](state: Common): boolean {
		return state.isToFilterTy4Scatter
	},
	[GET_SHADE_NAV_TIME](state: Common): boolean {
		return state.isShadeTimeBar
	},
	[GET_CURRENT_FORECAST_DT](state: Common): Date {
		return state.currentForecastDt
	},
	[GET_SCALAR_SHOW_TYPE](state: Common): ScalarShowTypeEnum {
		return state.scalarShowType
	},
	[GET_SURGE_TD_STEP](state: Common): number {
		return state.surgeTdStep
	},
	[GET_TIMESPAN](state: Common): number {
		return state.timeSpan
	},
	[GET_NOW](state: Common): Date {
		return state.now
	},
	[GET_ISSUE_TS](state: Common): number {
		return state.issueTs
	},
	[GET_RASTER_COLOR_SCALE_RANGE](state: Common): IScale {
		return state.rasterScaleRange
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_SCALE_RANGE](state: Common, range: number[]): void {
		state.scaleRange = range
	},
	[SET_SCALE_DESC](state: Common, desc: string): void {
		state.scaleDesc = desc
	},
	[SET_SHOW_OPTS_FORM](state: Common, val: boolean): void {
		state.isShowOptionsForm = val
	},
	[SET_ISOSURGE_COLOR_SCALE_VAL_RANGE](state: Common, range: number[]): void {
		state.isoSurgeScaleValRange = range
	},
	[SET_ISOSURGE_COLOR_SCALE_STR_LIST](state: Common, scaleList: string[]): void {
		state.isoSurgeScaleStrList = scaleList
	},
	[SET_DATE_STEP](state: Common, val: number): void {
		state.step = val
	},
	[SET_SELECTED_LOOP](state: Common, val: boolean): void {
		state.isSelectedLoop = val
	},
	[SET_SHOW_STATION_DETAIL_FORM](state: Common, val: IExpandEnum): void {
		state.isShowStationDetailForm = val
	},
	[SET_SHOW_STATION_EXTREMUM_FORM](state: Common, val: IExpandEnum): void {
		state.isShowStationExtremumForm = val
	},
	[SET_SHOW_TY_SEARCH_FORM](state: Common, val: IExpandEnum): void {
		state.isShowTySearchDetailForm = val
	},
	[SET_TO_FILTER_TY_SCATTER](state: Common, val: boolean): void {
		state.isToFilterTy4Scatter = val
		// console.log(`坚挺到 to filter :${val}`)
	},
	[SET_SHADE_NAV_TIME](state: Common, val: boolean): void {
		state.isShadeTimeBar = val
		// console.log(`坚挺到 to filter :${val}`)
	},
	[SET_CURRENT_FORECAST_DT](state: Common, val: Date): void {
		state.currentForecastDt = val
		// console.log(`监听到 CURRENT_FORECAST_DT:${val}`)
	},
	[SET_SCALAR_SHOW_TYPE](state: Common, val: ScalarShowTypeEnum): void {
		state.scalarShowType = val
		// console.log(`坚挺到 to filter :${val}`)
	},
	[SET_SURGE_TD_STEP](state: Common, val: number): void {
		state.surgeTdStep = val
	},
	[SET_TIMESPAN](state: Common, val: number): void {
		state.timeSpan = val
	},
	[SET_NOW](state: Common, val: Date): void {
		state.now = val
	},
	[SET_ISSUE_TS](state: Common, val: number): void {
		state.issueTs = val
	},
	[SET_RASTER_COLOR_SCALE_RANGE](state: Common, val: IScale): void {
		state.rasterScaleRange = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
