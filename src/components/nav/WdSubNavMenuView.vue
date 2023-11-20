<template>
	<nav id="sub_nav_menu">
		<!-- sub-nav-menu -->
		<!-- <div class="nav_menu-item" v-for="menItem in menuList" :key="menItem.id">
			{{ menItem.title }}
		</div> -->
		<nav class="nav_item nav_item_icons">
			<div class="nav_item_icon fa-solid fa-house"></div>
		</nav>
		<el-tooltip class="item" effect="dark" content="标量场渲染方式" placement="top">
			<nav class="nav_item nav_item_icons">
				<div
					:class="[
						isShowRasterSwitchMenu ? 'activate' : 'un_activate',
						,
						'nav_item_icon',
					]"
					@click="isShowRasterSwitchMenu = !isShowRasterSwitchMenu"
				>
					<i class="fa-solid fa-tornado"></i>
				</div>
				<div class="hidden_box_switch" v-show="isShowRasterSwitchMenu">
					<el-switch v-model="isRasterShow" active-text="栅格" inactive-text="等值线">
					</el-switch>
				</div>
				<!-- <div class="nav_item_icon fa-solid fa-tornado"></div> -->
			</nav>
		</el-tooltip>
		<!-- 发布时间戳列表 -->
		<SubNavIssueTimeItem></SubNavIssueTimeItem>
		<!-- - 23-09-12 温带系统不需要切换时间 -->
		<!-- <SubNavTimeItem
			:forecastDt="forecastDt"
			:step="6"
			:forecastEndDt="forecastEndDt"
			@updateForecastDt="updateForecastDt"
		></SubNavTimeItem> -->
		<SubNavTimespanItem
			:timeSpan="timeSpan"
			:timeStep="timeStep"
			@updateTimespan="updateTimespan"
		></SubNavTimespanItem>
		<SubNavTemp :tempVal="tdStep + 'H'" :tempTitle="tempTitle"></SubNavTemp>
	</nav>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Mutation, Getter } from 'vuex-class'

import SubNavTimeItem from '@/components/nav/subItems/SubNavTimeItem.vue'
import TyphoonListView from '@/components/table/tyListView.vue'
import SubNavIssueTimeItem from '@/components/nav/subItems/SubNavIssueTimeItem.vue'
import SubNavTimespanItem from '@/components/nav/subItems/SubNavTimespanItem.vue'
import SubNavTemp from '@/components/nav/subItems/SubNavTemp.vue'
//
import * as L from 'leaflet'
// store
import {
	SET_IS_SELECT_LOOP,
	SET_BOX_LOOP_RADIUS,
	GET_BOX_LOOP_LATLNG,
	GET_CURRENT_TY_FORECAST_DT,
	GET_DATE_STEP,
	SET_TO_FILTER_TY_SCATTER,
	SET_FILTER_TY_SCATTER_MENU_TYPE,
	SET_SHADE_NAV_TIME,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_CURRENT_FORECAST_DT,
	GET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	SET_SHOW_TY_SEARCH_FORM,
	SET_SCALAR_SHOW_TYPE,
	SET_SURGE_TD_STEP,
	SET_TIMESPAN,
} from '@/store/types'
// 默认常量
import {
	DEFAULT_BOX_LOOP_RADIUS,
	DEFAULT_BOX_LOOP_RADIUS_UNIT,
	DEFAULT_DATE,
	DEFAULT_DATE_STEP,
	DEFAULT_TIMESTAMP,
	DEFAULT_TIME_SPAN,
	DEFAULT_TIME_SPAN_WD,
	DEFAULT_WD_TIME_SPAN,
} from '@/const/default'
import { MS_UNIT } from '@/const/unit'
// api
import { loadTyListByRange, loadTyListByUniqueParams } from '@/api/typhoon'
import { loadRecentCoverageDateRange, loadWaveProductForecastRealDataList } from '@/api/wave'
// mid model
import { FilterTyMidModel } from '@/middle_model/typhoon'
// 枚举
import { TyScatterMenuType } from '@/enum/menu'
import { FilterTypeEnum } from '@/enum/filter'
import { IHttpResponse } from '@/interface/common'
import { EventBus } from '@/bus/BUS'
import {
	TO_CLEAR_ALL_FILTER_TYS,
	TO_CLEAR_ALL_LAYER,
	TO_GET_UNIQUE_TY_SEARCH_LIST,
	TO_FILTER_TY_PATH_LIST,
	TO_LOAD_FORECASTDATALIST_COORDS,
} from '@/bus/types'
//
import { sortFilterTyList } from '@/util/sortUtil'
import { LayerTypeEnum } from '@/enum/map'
import moment from 'moment'
import wave from '@/store/modules/wave'
import { IExpandEnum, ScalarShowTypeEnum } from '@/enum/common'

/** + 22-10-14 副导航栏(布局:底部) */
@Component({
	components: {
		SubNavTimeItem,
		TyphoonListView,
		SubNavIssueTimeItem,
		SubNavTimespanItem,
		SubNavTemp,
	},
})
export default class WdSubNavMenuView extends Vue {
	/** 是否圈选 */
	checkedSelectLoop = false

	/** 筛选后的台风集合 */
	filterTyList: FilterTyMidModel[] = []
	filterTyCount = 0
	/** 是否在加载筛选后的台风集合 */
	isLoadingTyList = false

	get selectLoopCls(): string {
		return this.checkedSelectLoop ? 'activate' : 'un_activate'
	}

	forecastDt: Date = new Date()
	forecastEndDt: Date = new Date()

	/** 是否加载过滤后的台风散点(或热图) */
	isLoadFilterTyScatters = false

	/** 是否展开显示 标量场选项 */
	isShowRasterSwitchMenu = true
	isRasterShow = true

	/** 标量场展示形式 */
	scalarShowType: ScalarShowTypeEnum = ScalarShowTypeEnum.RASTER

	created() {
		this.forecastDt = new Date()
		this.setForecastDt(this.forecastDt)
	}

	@Watch('isRasterShow')
	onIsRasterShow(val: boolean): void {
		let scatterMenu = ScalarShowTypeEnum.RASTER
		if (this.isShowRasterSwitchMenu) {
			scatterMenu = this.isRasterShow
				? ScalarShowTypeEnum.RASTER
				: ScalarShowTypeEnum.ISOSURFACE
		}
		this.setScalarShowType(scatterMenu)
	}

	/** 时间间隔 */
	dateStep: number = DEFAULT_DATE_STEP

	/** 查询的起止时间间隔(单位:s) */
	timeSpan: number = DEFAULT_WD_TIME_SPAN

	/** 最大可提供的查询时间间隔(default:7d) */
	timeSpanMax: number = 60 * 60 * 24 * 7

	/** 增加的时间步长(1d) */
	timeStep: number = 60 * 60 * 24

	// tdStep = 0

	tempTitle = '数据间隔'

	@Watch('checkedSelectLoop')
	onCheckedSelectLoop(val: boolean): void {
		this.setIsSelectLoop(val)
	}

	/** + 23-01-05: 通过事件总线执行 按照经纬度加载预报时序数据 */
	busToLoadForecastDataListByCoords(queryParams: {
		latlng: L.LatLng
		layerType: LayerTypeEnum
		issueTimestamp: number
	}): void {
		EventBus.$emit(TO_LOAD_FORECASTDATALIST_COORDS, queryParams)
	}

	submit(): void {
		const data: { boxLoopLatlng: L.LatLng } = {
			boxLoopLatlng: this.getBoxLoopLatlng,
		}
		const self = this
		this.isLoadingTyList = true
		// 按照当前获取的选中经纬度加载该经纬度对应的海浪时序数据
		const waveOpts = this.waveOpts
		this.setShowTySearchForm(IExpandEnum.EXPANDED)
		this.busToLoadForecastDataListByCoords({
			latlng: this.getBoxLoopLatlng,
			layerType: waveOpts.getWaveProductLayerType,
			issueTimestamp: waveOpts.getWaveProductIssueTimestamp,
		})
	}

	/** 清理当前的圈选范围以及当前选中的台风 */
	deepClear(): void {
		// this.setCurrentTy(null)
		this.busToClearAllLayers()
	}

	/** 通过事件总线清除全部图层 */
	busToClearAllLayers(): void {
		EventBus.$emit(TO_CLEAR_ALL_LAYER)
	}

	/** 更新当前的 预报时刻  */
	updateForecastDt(val: Date): void {
		// this.forecastDt = val
		console.log(`监听到菜单栏更新了当前预报时间:${val}`)
		this.setForecastDt(val)
	}

	/** 子组件调用——更新时间间隔 */
	updateTimespan(val: number): void {
		if (val <= this.timeSpanMax) {
			this.timeSpan = val
		}
	}

	/** 获取当前选中的经纬度 */
	@Getter(GET_BOX_LOOP_LATLNG, { namespace: 'map' }) getBoxLoopLatlng: L.LatLng

	@Getter(GET_CURRENT_TY_FORECAST_DT, { namespace: 'typhoon' }) getTyForecastDt

	@Getter(GET_DATE_STEP, { namespace: 'common' }) getDateStep

	/** 设置是否进行圈选操作 */
	@Mutation(SET_IS_SELECT_LOOP, { namespace: 'map' }) setIsSelectLoop

	/** 设置圈选的半径 */
	@Mutation(SET_BOX_LOOP_RADIUS, { namespace: 'map' }) setBoxLoopRadius

	/** 设置 遮罩 timebar */
	@Mutation(SET_SHADE_NAV_TIME, { namespace: 'common' }) setShadeTimebar

	/** 设置当前台风预报时间 */
	@Mutation(SET_CURRENT_FORECAST_DT, { namespace: 'common' }) setForecastDt

	/** 设置标量场的显示类型 栅格图层|等值面 */
	@Mutation(SET_SCALAR_SHOW_TYPE, { namespace: 'common' }) setScalarShowType: {
		(val: ScalarShowTypeEnum): void
	}

	/** 显示台风搜索form(格点时序数据form) */
	@Mutation(SET_SHOW_TY_SEARCH_FORM, { namespace: 'common' })
	setShowTySearchForm: { (val: IExpandEnum): void }

	/** 潮位 table 中的 td 之间的时间间隔(h) */
	@Mutation(SET_SURGE_TD_STEP, { namespace: 'common' })
	setSurgeTdStep: { (val: number) }

	/** 设置时间间隔 */
	@Mutation(SET_TIMESPAN, { namespace: 'common' })
	setTimespan: { (val: number) }

	/** 获取当前产品的发布时间 */
	@Getter(GET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' })
	getWaveProductIssueDt: Date

	@Getter(GET_WAVE_PRODUCT_ISSUE_TIMESTAMP, { namespace: 'wave' })
	getWaveProductIssueTimestamp: number

	/** 获取当前选中的海浪产品图层 */
	@Getter(GET_WAVE_PRODUCT_LAYER_TYPE, { namespace: 'wave' })
	getWaveProductLayerType: LayerTypeEnum

	get waveOpts(): {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
	} {
		const { getWaveProductIssueTimestamp, getWaveProductLayerType } = this
		return { getWaveProductIssueTimestamp, getWaveProductLayerType }
	}

	@Watch('getWaveProductIssueDt')
	onGetWaveProductIssueDt(val: Date): void {
		// 此处若为 vuex 中对应的变量赋相同的时间，仍会触发此监听
		console.log(val)
	}

	@Watch('getWaveProductLayerType')
	onGetWaveProductType(val: LayerTypeEnum): void {
		console.log(val)
	}

	@Watch('getWaveProductIssueTimestamp')
	onGetWaveProductIssueTimestamp(val: number): void {
		// 若在 vuex 中为对应的变量赋相同的时间戳(int),不会再次触发此监听
		console.log(val)
	}

	@Watch('waveOpts')
	onWaveOpts(newVal: {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
	}): void {
		if (
			newVal.getWaveProductIssueTimestamp != DEFAULT_TIMESTAMP &&
			newVal.getWaveProductLayerType != LayerTypeEnum.UN_LAYER
		) {
			console.log(
				`监听到waveOpts发生变化: layerType:${
					newVal.getWaveProductLayerType
				},issueTimestamp:${newVal.getWaveProductIssueTimestamp},issusDt:${moment(
					newVal.getWaveProductIssueTimestamp * MS_UNIT
				).toDate()}`
			)
			loadRecentCoverageDateRange(newVal.getWaveProductLayerType).then(
				(res: IHttpResponse<{ gmt_forecast_start: string; gmt_forecast_end: string }>) => {
					try {
						this.forecastDt = moment(res.data.gmt_forecast_start).toDate()
						this.forecastEndDt = moment(res.data.gmt_forecast_end).toDate()
					} catch {
						console.log(res.data)
					}
				}
			)
		}
	}

	@Watch('getTyForecastDt')
	onTyForecast(val: Date): void {
		this.forecastDt = val
	}

	@Watch('getDateStep')
	onDateStep(val: number): void {
		this.dateStep = val
	}

	@Watch('timeSpan')
	onTimeSpan(val: number): void {
		this.setTimespan(val)
	}

	get tdStep(): number {
		const step = this.timeSpan / this.timeStep
		this.setSurgeTdStep(step)
		return step
	}
}
</script>
<style lang="less">
@import '../../styles/btn.less';
.nav_item {
	// transition: all 0.5s;
	box-shadow: 0 0 5px 0px black;
}

.un_padding {
	padding: 0px !important;
}
.hidden_box_radius {
	width: 80px;
	margin-left: 10px;
	margin-right: 10px;
}
.hidden_box_switch {
	width: 140px;
	margin-left: 10px;
	margin-right: 10px;
}

#sub_nav_menu {
	display: flex;
	// flex-direction: column;
	// height: 100%;
	width: 100%;
	background: #34495e;
	color: white;
	border-radius: 8px;
	.nav_menu-item {
		background: #2c3e50;
	}
	.nav_item_icons {
		background: #233446;
		padding: 5px;
		margin: 5px;
		border-radius: 8px;
		display: flex;
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 36px;
		overflow: hidden;
		svg {
			margin-left: 5px;
			margin-right: 5px;
		}
	}
}
</style>
