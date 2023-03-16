<template>
	<div
		id="wave_scalar_form"
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
						<span>位置</span><span>{{ latlng | filterLatlng2Str }}</span>
					</div>
					<div class="row"><span>产品种类</span><span>有效波高</span></div>
					<div class="row">
						<span>发布时间</span><span>{{ getWaveIssueDt | fortmatData2YMDHM }}</span>
					</div>
					<div class="row">
						<span>预报时间</span><span>{{ getForecastDt | fortmatData2YMDHM }}</span>
					</div>
				</div>
			</div>
			<div class="info-card forecast-info">
				<h3>预报信息</h3>
				<!-- <div class="card-title">基础信息</div> -->
				<div>
					<div class="row">
						<span>有效波高</span><span>{{ currentSWH | formatSurge2Str }}</span>
					</div>
					<div class="row">
						<span>平均周期</span><span>{{ currentMWP | formatSurgeFixed2Str }}</span>
					</div>
					<div class="row">
						<span>平均波向</span><span>{{ currentMWD | formatSurgeFixed2Str }}</span>
					</div>
					<div class="row">
						<span>风浪波高</span><span>{{ currentSHWW | formatSurge2Str }}</span>
					</div>
				</div>
			</div>
		</div>
		<!-- 对于非集合路径才提供叠加天文潮位的选项 -->
		<div id="wave_scalar_chart"></div>
		<div class="down-section">
			<WaveVasTableView
				:mwdList="valMWDList"
				:mwpList="valMWPList"
				:shwwList="valSWHList"
				:swhList="valSHWWList"
				:forecastDtList="dtList"
				:propHoverIndex="hoverDtIndex"
			></WaveVasTableView>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import * as echarts from 'echarts'
import * as L from 'leaflet'
import chroma from 'chroma-js'
import WaveVasTableView from '@/components/table/waveValTableView.vue'
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

// store
import { GET_CURRENT_FORECAST_DT, GET_WAVE_PRODUCT_ISSUE_DATETIME } from '@/store/types'
//
// api
import { loadStationAlertLevelDataList, loadStationDetailDataList } from '@/api/station'
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
	components: { WaveVasTableView },
})
export default class TideChartView extends Vue {
	isLoading = false

	/** 当前的图表charts对象(唯一) */
	myChart: echarts.ECharts = null

	/** 预报时间列表 */
	forecastDtList: Date[] = []
	dtList: Date[] = []
	/** 预报值(天文潮)列表 */
	forcastValList: number[] = []

	yAxisMin = 0
	yAxisMax = 0

	chartTitle = '指定位置时序数据'
	chartSubTitle = '--'
	/** 当前的预报产品种类 */
	productType: LayerTypeEnum = LayerTypeEnum.UN_LAYER
	/** 当前选中的位置 */
	latlng: L.LatLng = DEFAULT_BOX_LOOP_LATLNG
	/** 发布时间 */
	// issueDate: Date = DEFAULT_DATE
	// forecastDate: Date = DEFAULT_DATE
	/** 当前的有效波高 */
	// currentSWH: number = DEFAULT_SURGE_VAL
	/** 当前的平均周期 */
	// currentMWP: number = DEFAULT_SURGE_VAL
	/** 当前的平均波向 */
	// currentMWD: number = DEFAULT_SURGE_VAL
	/** 当前的风浪波高 */
	// currentSHWW: number = DEFAULT_SURGE_VAL
	/** 有效波高集合 */
	valSWHList: number[] = []
	/** 平均周期集合 */
	valMWPList: number[] = []
	/** 平均波向集合 */
	valMWDList: number[] = []
	/** 风浪波高集合 */
	valSHWWList: number[] = []

	/** 鼠标移入 chart 中的 index */
	hoverDtIndex = 0
	/** 表格中的海浪观测数据 */
	tableWaveValsList: { mwd: number; mwp: number; forecastDt: Date }[] = []

	created() {
		EventBus.$on(TO_LOAD_FORECASTDATALIST_COORDS, this.loadWaveForecastDataListbyCoords)
		// console.log(`当前charts窗口大小:${document.getElementById('wave_scalar_chart')}`)
	}

	/** + 23-01-05 加载海浪指定产品的时序数据 */
	loadWaveForecastDataListbyCoords(val: {
		latlng: L.LatLng
		layerType: LayerTypeEnum
		issueTimestamp: number
	}): void {
		const self = this
		// 通过 bus 总线获取到传入的 经纬度 | 发布时间 | 图层类型
		this.productType = val.layerType
		this.latlng = val.latlng
		// this.issueDate = new Date(val.issueTimestamp)
		// TODO:[-] 23-02-06 此处对应后台加入是 矢量场|标量场 的判断
		/** 转换后的layertype : 矢量|标量 */
		const convertedLayerType = this.getLayerType(val.layerType)
		loadWaveProductForecastRealDataList(
			convertedLayerType,
			val.issueTimestamp.toString(),
			val.latlng
		).then(
			(
				res: IHttpResponse<
					{
						product_type: number
						real_list: { time: string; val: number }[]
					}[]
				>
			) => {
				// console.log(res)
				/*
				[
					{
						"product_type": 2001,
						"real_list": [
							{
								"swh": 1.2647790541438102,
								"time": "2022-01-02T00:00:00Z"
							},
						]
					}
				]
				*/
				let xlist: Date[] = []
				// let ylist: number[] = []
				// let shwwList: number[] = []
				// let swhList: number[] = []
				self.valSWHList = []
				self.valSHWWList = []
				self.valMWPList = []
				self.valMWDList = []
				// self.tableWaveValsList = []
				if (res.status === 200) {
					res.data.forEach((temp) => {
						if (temp.product_type === LayerTypeEnum.RASTER_LAYER_WVE) {
							temp.real_list.forEach((swh) => {
								xlist.push(new Date(swh.time))
								// self.forecastDtList.push(new Date(swh.time))
								const formatValStr = swh.val.toFixed(2)
								const formatValNum = parseFloat(formatValStr)
								// swhList.push(formatValNum)
								self.valSWHList.push(formatValNum)
							})
						}
						if (temp.product_type === LayerTypeEnum.RASTER_LAYER_SHWW) {
							temp.real_list.forEach((shww) => {
								const formatValStr = shww.val.toFixed(2)
								const formatValNum = parseFloat(formatValStr)
								// shwwList.push(formatValNum)
								self.valSHWWList.push(formatValNum)
							})
						}
						if (
							[
								LayerTypeEnum.RASTER_LAYER_MWP,
								LayerTypeEnum.RASTER_LAYER_MWD,
							].findIndex((val) => {
								return val == temp.product_type
							}) >= 0
						) {
							if (temp.product_type === LayerTypeEnum.RASTER_LAYER_MWP) {
								temp.real_list.map((mwp) => {
									self.valMWPList.push(mwp.val)
								})
							} else if (temp.product_type === LayerTypeEnum.RASTER_LAYER_MWD) {
								temp.real_list.map((mwp) => {
									self.valMWDList.push(mwp.val)
								})
							}
						}
					})
					self.forecastDtList = xlist
					self.dtList = xlist
					const yMax: number = Math.max(...self.valSWHList, ...self.valSHWWList)
					this.yAxisMax = yMax
					const yMin: number = Math.min(...self.valSWHList, ...self.valSHWWList)
					this.yAxisMin = yMin
					this.initCharts(
						xlist,
						[
							{ fieldName: 'swh', yList: self.valSWHList },
							{ fieldName: 'shww', yList: self.valSHWWList },
						],
						self.currentForecastDtIndex
					)
				}
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

	initCharts_backup(xList: Date[], yList: number[], filedName: string): void {
		const that = this
		const nodeDiv = document.getElementById('wave_scalar_chart')
		if (nodeDiv) {
			const myChart: echarts.ECharts = echarts.init(nodeDiv)
			// this.surgeByGroupPath = []
			const option = {
				title: {
					text: that.chartTitle,
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
						label: {
							backgroundColor: '#d4e257',
							formatter: (params): string => {
								return fortmatData2MDHM(params.value)
							},
						},
					},
					// valueFormatter: (val) => val.toFixed(1),
					// formatter: (params: { seriesName: string; data: number }[]): string => {
					// 	// + 22-10-26 params[0]:天文潮 ; params[1]:实况

					// 	// let content = params[0].data
					// 	// console.log(params)
					// 	let content = `${params[0].data},${params[1].data}`
					// 	return content
					// },
				},
				legend: {
					data: [
						{
							name: filedName,
							itemStyle: {
								color: 'rgba(255, 191, 0)',
							},
							textStyle: {
								color: 'rgba(255, 191, 0)',
							},
						},
					],
					right: '10%',
				},
				toolbox: {
					feature: {
						saveAsImage: {},
					},
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
							// formatter: (val: Date) => {
							// 	return fortmatData2YMDHM(val)
							// },
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
				series: [
					{
						name: filedName,
						type: 'line',
						areaStyle: {
							opacity: 0.8,
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{
									offset: 0,
									color: 'rgba(255, 191, 0)',
								},
								{
									offset: 1,
									color: '#C848B9',
								},
							]),
						},

						lineStyle: { color: 'rgba(255, 191, 0)' },
						emphasis: {
							focus: 'series',
						},
						data: yList,
						showSymbol: false,
						smooth: true,
						// 22-12-09 取消了极值的垂直于x轴的标记线
						// markLine: {
						// 	symbol: ['none', 'none'],
						// 	label: { show: false },
						// 	data: [{ xAxis: that.getStormSurgeMaxIndex }],
						// },
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
					},
				],
			}
			// TODO:[-] 22-07-05 加入多条集合路径曲线
			const lineStyle = {
				width: 1,
				opacity: 0.5,
			}
			myChart.setOption(option)
			this.myChart = myChart
		}
	}

	initCharts(
		xList: Date[],
		yVals: { yList: number[]; fieldName: string }[],
		selectIndex: number
	): void {
		const that = this
		const nodeDiv = document.getElementById('wave_scalar_chart')
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
				'#00429d',
				'#4771b2',
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
					areaStyle: {
						opacity: 0.8,
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{
								offset: 0,
								color: scale(index / fieldsCount).hex(),
							},
							{
								offset: 1,
								color: scale((index + 1) / fieldsCount).hex(),
							},
						]),
					},
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
			yVals.forEach((temp) => {})
			// this.surgeByGroupPath = []
			const option = {
				title: {
					text: that.chartTitle,
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
						label: {
							backgroundColor: '#d4e257',
							formatter: (params: {
								value: number
								axisDimension: string
								axisIndex: number
								seriesData: {
									data: number
									dataIndex: number
									seriesName: string
									seriesType: string
									value: number
								}[]
							}): string => {
								// params :value: 0.4911190576356751, axisDimension: 'y', axisIndex: 0
								// return params
								// TODO:[-] 23-02-10 此处加入判断，若存在 seriesData , 取出 index=0 位置处的 dataIndex 赋值给 hoverIndex
								// TODO:[*] 23-02-10 此处应加入防抖处理
								try {
									if (params['seriesData'] && params.seriesData.length > 0) {
										if (that.hoverDtIndex !== params.seriesData[0].dataIndex) {
											that.hoverDtIndex = params.seriesData[0].dataIndex
											console.log(`hover index :${that.hoverDtIndex}`)
										}
										// console.log(`mouse hover in:${that.hoverDtIndex}`)
									}
								} catch (error) {
									console.log(error)
									that.hoverDtIndex = 0
								}

								return fortmatData2MDHM(params.value)
								// if (params.seriesData.length > 0) {
								// 	// let swhFilter = params.seriesData.find((temp) => {
								// 	// 	temp.seriesName == 'swh'
								// 	// })
								// 	let swhFilter = params.seriesData.find((temp) => {
								// 		return temp.seriesName == 'swh'
								// 	})
								// 	let swh = swhFilter !== undefined ? swhFilter.data : '-'
								// 	let shwwFilter = params.seriesData.find((temp) => {
								// 		return temp.seriesName == 'shww'
								// 	})
								// 	let shww = shwwFilter !== undefined ? swhFilter.data : '-'
								// 	const content = `有效波高:${swh}</br>风浪波高:${shww}`
								// 	return content
								// } else {
								// 	return '-'
								// }
							},
						},
					},
					// valueFormatter: (val) => val.toFixed(1),
					formatter: (params: { seriesName: string; data: number }[]): string => {
						// + 22-10-26 params[0]:天文潮 ; params[1]:实况
						// let content = params[0].data
						let content = `有效波高:${params[0].data}</br>风浪波高:${params[1].data}`
						return content
					},
				},
				legend: {
					data: legendData,
					right: '10%',
				},
				// toolbox: {
				// 	feature: {
				// 		saveAsImage: {},
				// 	},
				// },
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
			myChart.setOption(option)
			// myChart.on('click', function (params) {
			// 	console.log(params)
			// 	window.open('https://www.baidu.com/')
			// })
			// myChart.on('click', function (params) {
			// 	window.open('https://www.baidu.com/s?wd=' + encodeURIComponent(params.name))
			// })
			// myChart.on('click', (params) => {
			// 	window.open('https://www.baidu.com/s?wd=' + encodeURIComponent(params.name))
			// })
			myChart.getZr().on('click', (params) => {
				console.log(`点击所有区域${params}`)
			})
			myChart.on('timelinechanged', (params) => {
				console.log(`时间轴中的时间点发生改变:${params}`)
			})
			this.myChart = myChart
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

	@Getter(GET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' }) getWaveIssueDt: Date

	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' }) getForecastDt: Date

	@Watch('currentForecastDtIndex')
	onCurrentForecastDtIndex(val: number): void {
		this.testMarkLine(val)
	}

	/** 当前预报时间在 forecastDtList 中的所在 index */
	get currentForecastDtIndex(): number {
		const current: Date = this.getForecastDt
		const filterDtIndex: number = this.forecastDtList.findIndex((temp) => {
			return current.getTime() === temp.getTime()
		})
		return filterDtIndex
	}

	get currentSWH(): number {
		let val = DEFAULT_SURGE_VAL
		if (
			this.currentForecastDtIndex >= 0 &&
			this.valSWHList.length >= this.currentForecastDtIndex
		) {
			val = this.valSWHList[this.currentForecastDtIndex]
		}
		return val
	}
	get currentMWP(): number {
		let val = DEFAULT_SURGE_VAL
		if (
			this.currentForecastDtIndex >= 0 &&
			this.valMWPList.length >= this.currentForecastDtIndex
		) {
			val = this.valMWPList[this.currentForecastDtIndex]
		}
		return val
	}
	get currentMWD(): number {
		let val = DEFAULT_SURGE_VAL
		if (
			this.currentForecastDtIndex >= 0 &&
			this.valMWDList.length >= this.currentForecastDtIndex
		) {
			val = this.valMWDList[this.currentForecastDtIndex]
		}
		return val
	}
	get currentSHWW(): number {
		let val = DEFAULT_SURGE_VAL
		if (
			this.currentForecastDtIndex >= 0 &&
			this.valSHWWList.length >= this.currentForecastDtIndex
		) {
			val = this.valSHWWList[this.currentForecastDtIndex]
		}
		return val
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
#wave_scalar_chart {
	// min-width: 660px;
	// min-height: 445px;
	height: 100%;
	// width: 100%;
	width: 880px;
	margin-left: 20px;
	// 信息栏
}
#wave_scalar_form {
	// @form-base-background();
	height: 100%;
	width: 100%;
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
