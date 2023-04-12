<template>
	<div
		id="station_scalar_form"
		class="my-detail-form"
		v-loading="isLoading"
		element-loading-spinner="el-icon-loading"
		element-loading-background="rgba(49, 59, 89, 0.733)"
	>
		<div class="upper-section">
			<div class="info-card base-info">
				<h3>基础信息</h3>
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
			<div class="info-card forecast-info">
				<h3>预报信息</h3>
				<!-- <div class="card-title">基础信息</div> -->
				<div>
					<div class="row"><span>潮位</span><span>-</span></div>
					<div class="row"><span>天文潮位</span><span>-</span></div>
					<div class="row"><span>时间</span><span>-</span></div>
				</div>
			</div>
		</div>
		<!-- 对于非集合路径才提供叠加天文潮位的选项 -->
		<div id="surge_scalar_chart"></div>
		<div class="down-section">
			<SurgeTableView
				:surgeList="surgeList"
				:tideList="tideList"
				:forecastDtList="dtList"
				:diffSurgeList="diffSurgeList"
				:propHoverIndex="hoverDtIndex"
			></SurgeTableView>
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

import SurgeTableView from '@/components/table/surgeValTableView.vue'

// store
import {
	GET_CURRENT_FORECAST_DT,
	GET_STATION_CODE,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
} from '@/store/types'
//
// api
import { loadTargetStationSurgeRealdataList, loadTargetStationTideRealdataList } from '@/api/surge'
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
		SurgeTableView,
	},
})
export default class StationSurgeChartView extends Vue {
	isLoading = false

	/** 当前的图表charts对象(唯一) */
	myChart: echarts.ECharts = null

	/** 预报时间列表 */
	forecastDtList: Date[] = []
	dtList: Date[] = []
	/** 实况潮位 */
	surgeList: number[] = []
	/** 天文潮 */
	tideList: number[] = []
	/** 实况潮位-天文潮 */
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
		['surge', '潮位'],
		['difftide', '增水'],
	])

	stationCode = 'kusm'
	/** 起始时间 */
	startDt: Date = new Date('2023-03-02 10:30:00')
	/** TODO:[-] 23-04-04 此处修改为计算属性 endDt=start+timespan */
	// endDt: Date = new Date('2023-03-03 10:09:00')
	/** 时间跨度(单位:s) */
	timeSpan: number = 60 * 60 * 24

	/** 鼠标移入 chart 中的 index */
	hoverDtIndex = 0
	/** 表格中的海浪观测数据 */
	tableWaveValsList: { mwd: number; mwp: number; forecastDt: Date }[] = []

	created() {
		// EventBus.$on(TO_LOAD_FORECASTDATALIST_COORDS, this.loadWaveForecastDataListbyCoords)
		this.loadTargetStationSurgeDataList(this.stationCode, this.startDt, this.endDt)
		this.loadStationRegionCountry(this.stationCode)
		// console.log(`当前charts窗口大小:${document.getElementById('wave_scalar_chart')}`)
	}

	/** + 23-03-30 加载当前 code 的指定时间范围内的 [start,end] 的潮位数据并初始化 charts*/
	loadTargetStationSurgeDataList(code: string, start: Date, end: Date): void {
		const that = this
		loadTargetStationSurgeRealdataList(code, start, end)
			.then(
				(
					res: IHttpResponse<
						{
							station_code: string
							surge: number
							tid: number
							gmt_realtime: string
							ts: number
						}[]
					>
				) => {
					/** 时间集合 */
					let dtList: Date[] = []
					/** 与时间集合相对应的潮位集合 */
					let surgeList: number[] = []
					res.data.forEach((element) => {
						dtList.push(new Date(element.gmt_realtime))
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
			.then((surgeList) => {
				loadTargetStationTideRealdataList(code, start, end).then(
					(
						res: IHttpResponse<
							{
								station_code: string
								surge: number
								tid: number
								gmt_realtime: string
								ts: number
							}[]
						>
					) => {
						let tideList = []
						res.data.forEach((element) => {
							tideList.push(Number(element.surge.toFixed(2)))
						})
						that.tideList = tideList
						let diffTideList = []
						// 求 surge -tide 的差值集合
						for (let index = 0; index < surgeList.length; index++) {
							if (
								surgeList[index] !== DEFAULT_SURGE_VAL &&
								tideList[index] !== DEFAULT_SURGE_VAL &&
								surgeList[index] !== null &&
								tideList[index] !== null
							) {
								diffTideList.push(
									Number((surgeList[index] - tideList[index]).toFixed(2))
								)
							} else {
								diffTideList.push(null)
							}
						}
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

						that.yAxisMax = Math.max(
							...noNanSurgeList,
							...noDefaultTideList,
							...noDefaultdiffSurgeList
						)

						that.yAxisMin = Math.min(
							...noNanSurgeList,
							...noDefaultTideList,
							...noDefaultdiffSurgeList
						)
						that.initCharts(
							that.dtList,
							[
								{ fieldName: 'surge', yList: surgeList },
								{ fieldName: 'tide', yList: tideList },
							],
							{ fieldName: 'difftide', vals: diffTideList },
							that.getChartTile,
							0
						)
					}
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
		const nodeDiv = document.getElementById('surge_scalar_chart')
		if (nodeDiv) {
			const myChart: echarts.ECharts = echarts.init(nodeDiv)
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

	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' }) getForecastDt: Date

	@Getter(GET_STATION_CODE, { namespace: 'station' }) getStationCode: string

	@Watch('getForecastDt')
	onGetForecastDt(now: Date): void {
		this.startDt = now
	}

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
		return this.stationCode + '站潮位'
	}

	/** 需要监听的 chart 配置项 */
	get chartOpts(): { stationCode: string; startDt: Date; endDt: Date } {
		const { stationCode, startDt, endDt } = this
		return {
			stationCode,
			startDt,
			endDt,
		}
	}

	@Watch('chartOpts')
	onChartOpts(val: { stationCode: string; startDt: Date; endDt: Date }): void {
		this.loadTargetStationSurgeDataList(val.stationCode, val.startDt, val.endDt)
		this.loadStationRegionCountry(val.stationCode)
	}

	/** 终止时间 */
	get endDt(): Date {
		const end = moment(this.startDt).add(this.timeSpan, 's')
		return end.toDate()
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
#station_scalar_form {
	// min-width: 660px;
	// min-height: 445px;
	// height: 100%;
	// height: 500px;
	// width: 100%;
	width: 880px;
	margin-left: 20px;
	// bottom: 100px;
	// 信息栏
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
	.upper-section {
		// color: white;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
		.info-card {
			color: white;
			width: 45%;
			margin: 5px;
			padding: 5px;
			h3 {
				display: flex;
				border-bottom: 1px solid #c4ccd6;
				padding: 5px;
			}
			.row {
				justify-content: space-between;
				display: flex;
				font-size: 13px;
			}
		}
	}
}
</style>
