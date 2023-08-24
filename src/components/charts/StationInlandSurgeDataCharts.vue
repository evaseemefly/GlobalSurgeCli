<template>
	<div
		id="station_scalar_form"
		class="my-detail-form"
		v-loading="isLoading"
		element-loading-spinner="el-icon-loading"
		element-loading-background="rgba(49, 59, 89, 0.733)"
	>
		<div class="left-section">
			<div class="info-card base-info">
				<h3>{{ getStationCode }} 站</h3>
				<div>
					<div class="row">
						<span>所属国家_en</span><span>{{ stationBaseInfo.country_en }}</span>
					</div>
					<div class="row">
						<span>所属区域_en</span><span>{{ stationBaseInfo.val_en }}</span>
					</div>
					<div class="row">
						<span>所属区域_ch</span><span>{{ stationBaseInfo.val_ch }}</span>
					</div>
					<!-- <div class="row"><span>站点</span><span>-</span></div> -->
					<div class="row">
						<span>位置</span
						><span>{{ stationBaseInfo.lat }} | {{ stationBaseInfo.lon }}</span>
					</div>
					<!-- <div class="row">
						<span>最后更新时间</span
						><span>{{ getWaveIssueDt | fortmatData2YMDHM }}</span>
					</div> -->
				</div>
			</div>
			<!-- <div class="info-card forecast-info">
				<h3>预报信息</h3>
				<div>
					<div class="row"><span>潮位</span><span>-</span></div>
					<div class="row"><span>天文潮位</span><span>-</span></div>
					<div class="row"><span>时间</span><span>-</span></div>
				</div>
			</div> -->
		</div>
		<div class="right-section">
			<!-- 对于非集合路径才提供叠加天文潮位的选项 -->
			<div id="surge_scalar_chart"></div>
			<div class="down-section">
				<SurgeValsTableInLand
					:startTs="startTs"
					:endTs="endTs"
					:surgeList="surgeList"
					:tideList="tideList"
					:forecastDtList="dtList"
					:diffSurgeList="diffSurgeList"
					:surgeTdStep="getSurgeTdStep"
					:propHoverIndex="hoverDtIndex"
				></SurgeValsTableInLand>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import * as echarts from 'echarts'
import * as L from 'leaflet'
import chroma from 'chroma-js'
// 常量
import {
	DEFAULT_ALERT_TIDE,
	DEFAULT_DATE,
	DEFAULT_SURGE_DIFF,
	DEFAULT_BOX_LOOP_LATLNG,
	DEFAULT_SURGE_VAL,
} from '@/const/default'
// 接口
import { IHttpResponse } from '@/interface/common'
//
// 枚举
import { TaskStatusEnum } from '@/enum/status'

import SurgeValsTableInLand from '@/components/table/SurgeValsTableInland.vue'

// store
import {
	GET_CURRENT_FORECAST_DT,
	GET_STATION_CODE,
	GET_SURGE_TD_STEP,
	GET_TIMESPAN,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
} from '@/store/types'
//
// api
import {
	loadTargetStationSurgeRealdataList,
	loadTargetStationTideRealdataList,
	loadInLandAstronomictideList,
} from '@/api/surge'
import { loadTargetStationSurgeForecastList, loadInLandAlertLevels } from '@/api/forecast/surge'
import { loadStaionRegionCountry, loadStationStaus } from '@/api/station'
// 工具方法
// filter
import {
	fortmatData2YMDHM,
	fortmatData2MDHM,
	filterProductTypeName,
	filterLatlng2Str,
	formatSurge2Str,
	formatSurgeFixed2Str,
} from '@/util/filter'
import moment from 'moment'
import { MenuType } from '@/enum/menu'
import station from '@/store/modules/station'
import { TO_LOAD_FORECASTDATALIST_COORDS } from '@/bus/types'
import { EventBus } from '@/bus/BUS'
import { LayerTypeEnum } from '@/enum/map'

import { loadWaveProductForecastRealDataList } from '@/api/wave'
import { filter } from 'vue/types/umd'
import { AlertTideEnum } from '@/enum/surge'

const MARGIN_TOP = 20
const MARGIN_BOTTOM = 20

@Component({
	filters: {
		filterProductTypeName,
		filterLatlng2Str,
		fortmatData2YMDHM,
		formatSurge2Str,
		formatSurgeFixed2Str,
	},
	components: {
		SurgeValsTableInLand,
	},
})
export default class StationInlandSurgeChartView extends Vue {
	// TODO:[*] 23-08-23 此处的起止时间及发布时间需要修改为动态获取
	@Prop({ type: Number })
	startTs: number

	@Prop({ type: Number })
	endTs: number

	@Prop({ type: Number })
	issueTs: number

	isLoading = false

	offsetNum = 0

	/** 当前的图表charts对象(唯一) */
	myChart: echarts.ECharts = null

	/** 预报时间列表 */
	forecastDtList: Date[] = []
	dtList: Date[] = []
	/** + 23-08-23 surgeList 基于 offseNum 进行的偏移 */
	mergeDiffSurgeList: number[] = []
	/** 实况潮位 */
	surgeList: number[] = []
	/** 天文潮 */
	tideList: number[] = []
	/** 实况潮位-天文潮=增水 */
	diffSurgeList: number[] = []
	/** 预报值(天文潮)列表 */
	forcastValList: number[] = []

	yAxisMin = 0
	yAxisMax = 0

	chartTitle = 'xxx站潮位'
	chartSubTitle = '--'
	/** 当前的预报产品种类 */
	productType: LayerTypeEnum = LayerTypeEnum.UN_LAYER
	/** 当前选中的位置 */
	latlng: L.LatLng = DEFAULT_BOX_LOOP_LATLNG

	alertBlue: number = DEFAULT_ALERT_TIDE
	alertYellow: number = DEFAULT_ALERT_TIDE
	alertOrange: number = DEFAULT_ALERT_TIDE
	alertRed: number = DEFAULT_ALERT_TIDE

	stationBaseInfo: {
		station_code: string
		station_name: string
		lat: number
		lon: number
		rid: number
		val_en: string
		val_ch: string
		cid: number
		country_en: string
	} = {
		station_code: '',
		station_name: '',
		lat: 0,
		lon: 0,
		rid: 0,
		val_en: '',
		val_ch: '',
		cid: 0,
		country_en: '',
	}

	seriesMap: Map<string, string> = new Map([
		['tide', '天文潮'],
		['surge', '增水'],
		['obs', '实况潮位'],
	])

	stationCode = 'kusm'
	/** 起始时间 */
	// startDt: Date = DEFAULT_DATE

	/** 当前选定的时间 */
	// selecetdDt: Date = DEFAULT_DATE
	/** TODO:[-] 23-04-04 此处修改为计算属性 endDt=start+timespan */
	// endDt: Date = new Date('2023-03-03 10:09:00')
	/** 时间跨度(单位:s) */
	// timeSpan: number = 60 * 60 * 24

	/** 鼠标移入 chart 中的 index */
	hoverDtIndex = 0
	/** 表格中的海浪观测数据 */
	tableWaveValsList: { mwd: number; mwp: number; forecastDt: Date }[] = []
	/** 警戒潮位集合 */
	alertLevels: { stationCode: string; tide: number; alert: AlertTideEnum }[] = []

	created() {
		// EventBus.$on(TO_LOAD_FORECASTDATALIST_COORDS, this.loadWaveForecastDataListbyCoords)
		this.loadTargetStationSurgeDataList(
			this.getStationCode,
			this.issueTs,
			this.startTs,
			this.endTs
		)
		this.loadStationRegionCountry(this.getStationCode)
		// console.log(`当前charts窗口大小:${document.getElementById('wave_scalar_chart')}`)
	}

	/** + 23-08-23 加入的数组偏移 */
	@Watch('offsetNum')
	onOffsetNumChanged(val: number) {
		// step1: 生成新的 surge 数组并填充Nan
		let newSurgeList = new Array(val)
		newSurgeList.fill(NaN)
		// step2: 将数组进行偏移
		let sliceSurgeList: number[] = this.diffSurgeList.slice(0, this.diffSurgeList.length - val)
		let mergeSurgeList = [...newSurgeList, ...sliceSurgeList]
		this.mergeDiffSurgeList = mergeSurgeList
		this.initCharts(
			this.dtList,
			[
				{ fieldName: 'obs', yList: this.surgeList },
				{ fieldName: 'tide', yList: this.tideList },
			],
			{ fieldName: 'surge', vals: this.mergeDiffSurgeList },
			'潮位',
			0
		)
	}

	/**
	 * + 23-03-30
	 * 加载当前 code 的指定时间范围内的 [start,end] 的潮位数据并初始化 charts
	 * step 1: 加载预报surge集合
	 * step 2: * 加载天文潮位集合
	 * step 3: * 记载四色警戒潮位
	 */
	async loadTargetStationSurgeDataList(
		code: string,
		issue: number,
		start: number,
		end: number
	): Promise<void> {
		const that = this
		/** FIELD:读取结果的限制长度 */
		let limitCount = 24
		// 加载指定发布时间的指定站点的72小时的整点预报集合
		loadTargetStationSurgeForecastList(code, issue, start, end)
			.then(
				(
					res: IHttpResponse<
						{
							station_code: string
							surge: number
							forecast_ts: number
							issue_ts: number
						}[]
					>
				) => {
					/** 时间集合 */
					let dtList: Date[] = []
					/** 与时间集合相对应的潮位集合 */
					let surgeList: number[] = []
					limitCount = res.data.length
					res.data.forEach((element) => {
						const tempMoment = moment(element.forecast_ts * 1000).toDate()
						dtList.push(tempMoment)
						let tempSurge = null
						if (element.surge !== DEFAULT_SURGE_VAL) {
							tempSurge = Number(element.surge.toFixed(2))
						}
						surgeList.push(tempSurge)
					})
					that.dtList = []
					that.surgeList = []
					that.dtList = dtList
					that.surgeList = surgeList
					that.yAxisMax = Math.max(...surgeList)
					const noNanList = surgeList.filter((val) => {
						return val != null
					})
					that.yAxisMin = Math.min(...noNanList)
					return surgeList
				}
			)
			.then(async (surgeList) => {
				await loadInLandAstronomictideList(code, start, end).then(
					(
						res: IHttpResponse<
							{
								station_code: string
								surge: number
								forecast_dt: Date
							}[]
						>
					) => {
						//  "station_code": "LYG",
						// "forecast_dt": "2023-06-28T12:00:00Z",
						// "surge": 157.0
						/** FIELD:天文潮集合 */
						let tideList = []
						res.data.forEach((element) => {
							tideList.push(Number(element.surge.toFixed(2)))
						})
						// 天文潮未做limit限制
						tideList = tideList.slice(0, limitCount)
						/** FIELD: 总潮位集合 */
						let sumSurgeList = []
						for (let index = 0; index < surgeList.length; index++) {
							if (
								surgeList[index] !== DEFAULT_SURGE_VAL &&
								tideList[index] !== DEFAULT_SURGE_VAL &&
								surgeList[index] !== null &&
								tideList[index] !== null
							) {
								sumSurgeList.push(
									Number((surgeList[index] + tideList[index]).toFixed(2))
								)
							} else {
								sumSurgeList.push(null)
							}
						}
						const diffTideList: number[] = []
						that.diffSurgeList = diffTideList
						const noNanSurgeList = surgeList.filter((val) => {
							return val != null
						})
						const noDefaultTideList = tideList.filter((val) => {
							return val !== DEFAULT_SURGE_VAL
						})

						const noDefaultdiffSurgeList = diffTideList.filter((val) => {
							return val !== DEFAULT_SURGE_VAL && val !== null
						})

						// TODO:[-] 23-07-21 统一更新当前页面的三个潮位集合
						that.tideList = tideList
						that.diffSurgeList = surgeList
						that.surgeList = sumSurgeList
					}
				)
				await loadInLandAlertLevels(code).then(
					(
						res: IHttpResponse<
							{
								station_code: string
								tide: number
								alert: number
							}[]
						>
					) => {
						that.alertLevels = []
						if (res.status === 200) {
							res.data.forEach((val) => {
								switch (true) {
									case val.alert === AlertTideEnum.BLUE:
										this.alertBlue = val.tide
										break
									case val.alert === AlertTideEnum.YELLOW:
										this.alertYellow = val.tide
										break
									case val.alert === AlertTideEnum.ORANGE:
										this.alertOrange = val.tide
										break
									case val.alert === AlertTideEnum.RED:
										this.alertRed = val.tide
										break
								}
							})
						}
					}
				)
			})
			.then(() => {
				// TODO:[-] 23-07-25 加入了警戒潮位，将init chart 放在最后的 then 中
				that.initCharts(
					that.dtList,
					[
						{ fieldName: 'obs', yList: that.surgeList },
						{ fieldName: 'tide', yList: that.tideList },
					],
					{ fieldName: 'surge', vals: that.diffSurgeList },
					'潮位',
					0
				)
			})
	}

	/** + 23-04-03 获取当前 code 的站点状态 */
	loadTargetStationStatus(code: string): void {
		loadStationStaus(code).then(
			(
				res: IHttpResponse<{
					station_code: string
					status: TaskStatusEnum
					tid: number
					gmt_realtime: Date
				}>
			) => {}
		)
	}

	loadStationRegionCountry(code: string): void {
		loadStaionRegionCountry(code).then(
			(
				res: IHttpResponse<{
					station_code: string
					station_name: string
					lat: number
					lon: number
					rid: number
					val_en: string
					val_ch: string
					cid: number
					country_en: string
				}>
			) => {
				this.stationBaseInfo = { ...res.data }
			}
		)
	}

	getLayerType(layerType: LayerTypeEnum): LayerTypeEnum {
		let all_layer_type = null
		switch (layerType) {
			case LayerTypeEnum.RASTER_LAYER_WVE:
				all_layer_type = LayerTypeEnum.RASTER_LAYER_ALL_SCALAR
				break
			case LayerTypeEnum.RASTER_LAYER_SHWW:
				all_layer_type = LayerTypeEnum.RASTER_LAYER_ALL_SCALAR
				break
			case LayerTypeEnum.RASTER_LAYER_MWP:
				all_layer_type = LayerTypeEnum.RASTER_LAYER_ALL_SCALAR
				break
			default:
				all_layer_type = LayerTypeEnum.UN_LAYER
				break
		}
		return all_layer_type
	}

	initCharts(
		xList: Date[],
		yVals: { yList: number[]; fieldName: string }[],
		areaVals: { vals: number[]; fieldName: string },
		title: string,
		selectIndex: number
	): void {
		const that = this
		const echartsId = 'surge_scalar_chart'
		const nodeDiv = document.getElementById(echartsId)
		let myChart: echarts.ECharts = null
		// TODO:[-] 23-08-24 若当前 mychart 已经被初始化，则需要先销毁
		if (this.myChart != null) {
			// [ECharts] Instance ec_1692844450070 has been disposed
			// this.myChart.dispose()
			myChart = echarts.getInstanceByDom(nodeDiv)
		} else {
			myChart = echarts.init(nodeDiv)
		}
		if (nodeDiv) {
			// There is a chart instance already initialized on the dom.

			let legendData: {
				name: string
				itemStyle: {
					color: string
				}
				textStyle: {
					color: string
				}
			}[] = []
			let series = []
			let scale = chroma.scale([
				// '#00429d',
				// '#4771b2',
				'#73a2c6',
				'#a5d5d8',
				'#ffffe0',
				'#ffbcaf',
				'#f4777f',
				'#cf3759',
				'#93003a',
			])
			/** 传入的不同变量的总数 */
			let fieldsCount: number = yVals.length + 1
			for (let index = 0; index < yVals.length; index++) {
				const element = yVals[index]
				const tempLegend: {
					name: string
					itemStyle: {
						color: string
					}
					textStyle: {
						color: string
					}
				} = {
					name: element.fieldName,
					itemStyle: {
						color: scale(index / fieldsCount).hex(),
					},
					textStyle: {
						color: scale(index / fieldsCount).hex(),
					},
				}
				legendData.push(tempLegend)

				const tempSeries = {
					name: element.fieldName,
					type: 'line',
					silent: false,
					// areaStyle: {
					// 	opacity: 0.8,
					// 	color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					// 		{
					// 			offset: 0,
					// 			color: scale(index / fieldsCount).hex(),
					// 		},
					// 		{
					// 			offset: 1,
					// 			color: scale((index + 1) / fieldsCount).hex(),
					// 		},
					// 	]),
					// },
					lineStyle: { color: scale(index / fieldsCount).hex() },
					emphasis: {
						focus: 'series',
					},
					data: element.yList,
					showSymbol: false,
					smooth: true,
					markPoint: {
						symbol: 'circle',
						symbolSize: 2,
						data: [
							{ type: 'max', name: 'Max' },
							{ type: 'min', name: 'Min' },
						],
						symbolOffset: [0, '-500%'],
						label: {
							color: '#fff',
						},
					},
					markLine: {
						symbol: ['none', 'none'],
						label: { show: false },
						data: [{ xAxis: that.currentForecastDtIndex }],
					},
				}
				series.push(tempSeries)
			}
			// TODO:[-] 23-04-11 加入 area series
			const element = areaVals
			const tempLegend: {
				name: string
				itemStyle: {
					color: string
				}
				textStyle: {
					color: string
				}
			} = {
				name: element.fieldName,
				itemStyle: {
					color: '#f39c12',
				},
				textStyle: {
					color: '#f39c12',
				},
			}
			legendData.push(tempLegend)

			const tempSeries = {
				name: element.fieldName,
				type: 'line',
				silent: false,
				areaStyle: {
					opacity: 0.8,
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{
							offset: 0,
							color: '#f1c40f',
						},
						{
							offset: 1,
							color: '#e67e22',
						},
					]),
				},
				lineStyle: { color: '#f1c40f' },
				emphasis: {
					focus: 'series',
				},
				data: element.vals,
				showSymbol: false,
				smooth: true,
				markPoint: {
					symbol: 'circle',
					symbolSize: 2,
					data: [
						{ type: 'max', name: 'Max' },
						{ type: 'min', name: 'Min' },
					],
					symbolOffset: [0, '-500%'],
					label: {
						color: '#fff',
					},
				},
				markLine: {
					symbol: ['none', 'none'],
					label: { show: false },
					data: [{ xAxis: that.currentForecastDtIndex }],
				},
			}
			series.push(tempSeries)

			// TODO:[*] 23-07-25 添加四色警戒潮位
			// TODO: 21-08-25 新加入的四色警戒潮位标线
			series.push({
				name: '警戒潮位',
				type: 'line',
				markLine: {
					symbol: 'none', // 虚线不显示端点的圆圈及箭头
					itemStyle: {
						color: 'rgb(19, 184, 196)',
					},
					data: [
						{
							name: '蓝色警戒潮位',
							yAxis: this.alertBlue,
						},
					],
				},
			})
			series.push({
				name: '警戒潮位',
				type: 'line',
				markLine: {
					symbol: 'none',
					itemStyle: {
						color: 'rgb(245, 241, 20)',
					},
					data: [
						{
							name: '黄色警戒潮位',
							yAxis: this.alertYellow,
						},
					],
				},
			})
			series.push({
				name: '警戒潮位',
				type: 'line',
				markLine: {
					symbol: 'none',
					itemStyle: {
						color: 'rgb(235, 134, 19)',
					},
					data: [
						{
							name: '橙色警戒潮位',
							yAxis: this.alertOrange,
						},
					],
				},
			})
			series.push({
				name: '警戒潮位',
				type: 'line',
				markLine: {
					symbol: 'none',
					itemStyle: {
						color: 'rgb(241, 11, 11)',
						lineStyle: {
							cap: 'round',
							type: 'dotted',
						},
					},
					data: [
						{
							name: '红色警戒潮位',
							yAxis: this.alertRed,
						},
					],
				},
			})
			//
			that.yAxisMax = Math.max(
				...[
					that.yAxisMax,
					that.alertBlue,
					that.alertYellow,
					that.alertOrange,
					that.alertRed,
				]
			)

			// that.yAxisMin ==
			// 	Math.min(
			// 		...[
			// 			that.,
			// 			that.alertBlue,
			// 			that.alertYellow,
			// 			that.alertOrange,
			// 			that.alertRed,
			// 		]
			// 	)
			// this.surgeByGroupPath = []
			const option = {
				title: {
					text: title,
					subtext: that.chartSubTitle,
					textStyle: {
						color: '#f8f8f7',
					},
				},
				tooltip: {
					trigger: 'axis',
					showContent: true,
					axisPointer: {
						type: 'cross',
					},
					formatter: function (params, ticket, callback) {
						/** 
						 * params[0].name
							'Thu Mar 02 2023 15:00:00 GMT+0800 (中国标准时间)'
							params[1].seriesName
							'tide'
							params[1].value
							2.36
						 */
						//x轴名称
						const dt = params[0].name
						const dtStr: string = fortmatData2YMDHM(dt)
						let html = '' + dtStr + '<br />'
						for (let index = 0; index < params.length; index++) {
							const temp = params[index]
							const seriesName: string = that.seriesMap.get(temp.seriesName)
							const seriesVal: string = isNaN(temp.value) ? '-' : temp.value
							// 拼接为 line
							const tempHtml = `${seriesName}:${seriesVal}` + '<br />'
							html = html + tempHtml
						}
						return html
					},
				},
				legend: {
					data: legendData,
					right: '10%',
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '3%',
					containLabel: true,
				},
				xAxis: [
					{
						type: 'category',
						boundaryGap: false,
						// data: that.forecastDateList,
						data: xList,
						nameTextStyle: {
							color: '#f8f8f7',
						},
						axisLabel: {
							textStyle: {
								color: '#f8f8f7', //字体颜色
								fontSize: 12, //字体大小
							},
							formatter: (val: Date) => {
								return fortmatData2YMDHM(val)
							},
						},
					},
				],
				yAxis: [
					{
						type: 'value',
						nameTextStyle: {
							color: '#f8f8f7',
						},
						axisLabel: {
							textStyle: {
								color: '#f8f8f7', //字体颜色
								fontSize: 12, //字体大小
							},
						},
						min: that.yAxisMin,
						max: that.yAxisMax,
						// scale: true
					},
				],
				series: series,
			}
			// TODO:[-] 22-07-05 加入多条集合路径曲线
			const lineStyle = {
				width: 1,
				opacity: 0.5,
			}
			// TODO:[*] 23-04-03
			// ERROR:`setOption` should not be called during main process.
			myChart.setOption(option)
			myChart.getZr().on('click', (params) => {
				console.log(`点击所有区域${params}`)
			})
			myChart.on('timelinechanged', (params) => {
				console.log(`时间轴中的时间点发生改变:${params}`)
			})
			if (!this.myChart) {
				this.myChart = myChart
			}
		}
	}

	testMarkLine(index: number): void {
		if (this.myChart !== null) {
			const options = this.myChart.getOption()
			if (options['series'] !== undefined) {
				// @ts-ignore
				if (options['series'].length > 0) {
					options['series'][0]['markLine'] = {
						symbol: ['none', 'none'],
						label: { show: false },
						data: [{ xAxis: this.currentForecastDtIndex }],
					}
				}
			}
			this.myChart.setOption(options)
			// console.log(options)
		}
	}

	/** 23-05-10 修改后的逻辑 forecastDt 为 end date */
	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' }) getForecastDt: Date

	@Getter(GET_STATION_CODE, { namespace: 'station' }) getStationCode: string

	@Getter(GET_SURGE_TD_STEP, { namespace: 'common' }) getSurgeTdStep: number

	@Getter(GET_TIMESPAN, { namespace: 'common' }) getTimespan: number

	// @Watch('getForecastDt')
	// onGetForecastDt(now: Date): void {
	// 	this.selecetdDt = now
	// }

	@Watch('currentForecastDtIndex')
	onCurrentForecastDtIndex(val: number): void {
		this.testMarkLine(val)
	}

	@Watch('getStationCode')
	onGetStationCode(code: string): void {
		this.stationCode = code
	}

	// @Watch('stationCode')
	// onStationCode(code: string): void {
	// 	this.loadTargetStationSurgeDataList(code, this.startDt, this.endDt)
	// 	this.loadStationRegionCountry(code)
	// }

	/** 当前预报时间在 forecastDtList 中的所在 index */
	get currentForecastDtIndex(): number {
		const current: Date = this.getForecastDt
		const filterDtIndex: number = this.forecastDtList.findIndex((temp) => {
			return current.getTime() === temp.getTime()
		})
		return filterDtIndex
	}

	get getChartTile(): string {
		return this.getStationCode + '站潮位'
	}

	/** 需要监听的 chart 配置项 */
	get chartOpts(): { getStationCode: string; startTs: number; endTs: number; issueTs: number } {
		const { getStationCode, startTs, endTs, issueTs } = this
		return {
			getStationCode,
			startTs,
			endTs,
			issueTs,
		}
	}

	@Watch('chartOpts')
	onChartOpts(val: {
		getStationCode: string
		startTs: number
		endTs: number
		issueTs: number
	}): void {
		this.loadTargetStationSurgeDataList(val.getStationCode, val.issueTs, val.startTs, val.endTs)
		this.loadStationRegionCountry(val.getStationCode)
	}

	/** TODO:[-] 23-07-19 终止时间 */
	get endDt(): Date {
		return this.getForecastDt
	}

	get startDt(): Date {
		const start = moment(this.getForecastDt).add(-this.getTimespan, 's')
		return start.toDate()
	}
}
</script>
<style scoped lang="less">
@import '../../styles/station/station-chart.less';
// @import url('../../styles/base-form.less');
.my-detail-form {
	height: 100%;
	width: 100%;
}
// 潮位chart
#surge_scalar_chart {
	// height: 100%;
	height: 250px;
	width: 100%;
}
#station_scalar_form {
	// @form-base-background();
	// height: 100%;
	// width: 100%;
	flex-direction: row;
	.left-section {
		background: #2c3e50;
		display: flex;
		// flex: 1;
		// width: 200px;
		flex-direction: row;
		justify-content: center;
		.info-card {
			color: white;
			// width: 45%;
			width: 150px;
			margin: 5px;
			padding: 5px;
			h3 {
				display: flex;
				border-bottom: 1px solid #c4ccd6;
				padding: 5px;
				font-size: 18px;
				align-items: center;
				letter-spacing: 0.36px;
			}
			.row {
				// justify-content: space-between;
				display: flex;
				justify-content: space-between;
				font-size: 14px;
				line-height: 24px;
			}
		}
	}
	.right-section {
		width: 1060px;
		max-width: 1200px;
		padding: 5px;
		margin: 5px;
		display: flex;
		// flex: 5;
		flex-direction: column;
	}
	// 不再使用此种布局
	.upper-section {
		// color: white;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
	}
}
</style>
