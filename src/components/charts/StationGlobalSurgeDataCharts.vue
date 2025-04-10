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
				<ObsDataTableView
					:forecastDtList="forecastDtList"
					:surgeList="diffSurgeList"
					:tideList="tideList"
					:forecastValList="forecastValList"
					:diffSurgeList="diffSurgeList"
					:propHoverIndex="hoverDtIndex"
				></ObsDataTableView>
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
	DEFAULT_STATION_CODE,
	DEFAULT_TIMESTAMP,
	DEFAULT_VAL_LIST,
} from '@/const/default'
// 接口
import { IHttpResponse } from '@/interface/common'
//
// 枚举
import { TaskStatusEnum } from '@/enum/status'

import ObsDataTableView from '@/components/table/obsDataTableView.vue'

// store
import {
	GET_CURRENT_FORECAST_DT,
	GET_GLOBAL_SURGE_ISSUE_TS,
	GET_ISSUE_TS,
	GET_STATION_CODE,
	GET_SURGE_TD_STEP,
	GET_TARGET_POSITION_LATLNG,
	GET_TIMESPAN,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
} from '@/store/types'
//
// api
import { loadTargetStationSurgeRealdataList, loadTargetStationTideRealdataList } from '@/api/surge'
import { loadTargetPositionSurgeForecastdataList } from '@/api/coverage'
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
import { faL } from '@fortawesome/free-solid-svg-icons'

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
		ObsDataTableView,
	},
})
export default class StationGlobalSurgeChartView extends Vue {
	/** 预报的结束时间与 getForecastDt 的时间差(单位:s) */
	END_TIME_INTERVAL: number = 3 * 24 * 60 * 60

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
	/** 预报值列表 */
	forecastValList: number[] = []
	/** 预报时间戳集合 */
	forecastTsList: number[] = []

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
		['总潮位', '总潮位'],
		['实况增水值', '实况增水值'],
		['天文潮', '天文潮'],
		['预报增水值', '预报增水值'],
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

	created() {
		// EventBus.$on(TO_LOAD_FORECASTDATALIST_COORDS, this.loadWaveForecastDataListbyCoords)
		// this.loadTargetStationSurgeRealDataList(this.getStationCode, this.startDt, this.endDt)
		// this.loadTargetPositionSurgeForecastDataList(
		// 	this.getPositionLatlng.lat,
		// 	this.getPositionLatlng.lng,
		// 	this.getGlobalIssueTs
		// )
		if (
			this.checkChartOptsStandards(
				this.stationCode,
				this.getGlobalIssueTs,
				this.startDt,
				this.endDt
			)
		) {
			// TODO:[-] 24-12-09 以上替换为本方法
			this.initTargetPositionDataList(
				this.getStationCode,
				this.getPositionLatlng,
				this.startDt,
				this.currentDt,
				this.endDt,
				this.getGlobalIssueTs
			)
			this.loadStationRegionCountry(this.getStationCode)
			// console.log(`当前charts窗口大小:${document.getElementById('wave_scalar_chart')}`)
		}
	}

	/**
	 * 使用promise链式调用形式重写
	 * @param code
	 * @param position
	 * @param start
	 * @param current
	 * @param end
	 * @param issueTs
	 */
	async initTargetPositionDataList(
		code: string,
		position: L.LatLng,
		start: Date,
		current: Date,
		end: Date,
		issueTs: number
	) {
		this.$log.info(
			`当前选中的站点为:${code},起始时间为:${start},当前时间为:${current},结束时间为:${end}`
		)
		const realRes = await this.loadTargetStationSurgeRealDataList(code, start, current, end) //

		const startTs = current.getTime()
		const endTs = end.getTime()
		// TODO:[-] 24-12-11 注意此 起止时间有误
		/**
		 * start_dt: 2024-11-27T08:07:11.012Z
		   end_dt: 2024-12-04T08:07:11.012Z
		 */
		const forecastRes = await this.loadTargetPositionSurgeForecastDataList(
			position.lat,
			position.lng,
			issueTs,
			startTs,
			endTs
		)

		/** 数据对其 */
		const unifyData: {
			/** 合并后的时间戳数组 */
			mergedTimestamps: number[]
			/** 合并后的总潮位数组(只包含实况) */
			alignedSurgeList: number[]
			/** 合并后的天文潮数组(含预报时段) */
			alignedTideList: number[]
			/** 合并后的增水数组(只包含实况增水) */
			alignedDiffSurgeList: number[]
			/** 合并后的预报增水数组(只包含预报) */
			alignedForecastSurgeList: number[]
		} = this.unifyData(
			realRes.dtList,
			realRes.tideDtList,
			realRes.surgeList,
			realRes.tideList,
			realRes.diffSurgeList,
			forecastRes.forecastTsList,
			forecastRes.forecastValList
		)

		const dates = unifyData.mergedTimestamps.map((temp) => {
			return new Date(temp)
		})
		this.yAxisMax = Math.max(
			...[
				...unifyData.alignedSurgeList,
				...unifyData.alignedForecastSurgeList,
				...unifyData.alignedTideList,
				...unifyData.alignedDiffSurgeList,
			]
		)
		this.yAxisMin = Math.min(
			...[
				...unifyData.alignedSurgeList,
				...unifyData.alignedForecastSurgeList,
				...unifyData.alignedTideList,
				...unifyData.alignedDiffSurgeList,
			]
		)

		this.forecastDtList = dates
		this.diffSurgeList = unifyData.alignedDiffSurgeList
		this.tideList = unifyData.alignedTideList
		this.forecastValList = unifyData.alignedForecastSurgeList
		// TODO:[*] 24-12-10 缺少天文潮
		this.initCharts(
			dates,
			[
				{ fieldName: '总潮位', yList: unifyData.alignedSurgeList },
				{ fieldName: '天文潮', yList: unifyData.alignedTideList },
				{ fieldName: '预报增水值', yList: unifyData.alignedForecastSurgeList },
			],
			{ fieldName: '实况增水值', vals: unifyData.alignedDiffSurgeList },
			'实况增水',
			0
		)
		this.isLoading = false
	}

	/** TODO:[-] 24-12-09
	 * 将 预报 与 实况数据按照时间进行合并并返回
	 * TODO:[*] 24-12-12 传入的 tideList 为 169 转换后返回为 96有值，后面无值
	 */
	unifyData(
		dtList: Date[],
		tideDtList: Date[],
		surgeList: number[],
		tideList: number[],
		diffSurgeList: number[],
		forecastTs: number[],
		forecastVals: number[]
	) {
		// 1. 将 dtList 转换为时间戳数组
		const dtTimestamps = dtList.map((date) => date.getTime())

		const tideDtTimestamps = tideDtList.map((date) => date.getTime())

		// 2. 合并时间戳数组并去重排序
		const mergedTimestamps = Array.from(
			new Set([...dtTimestamps, ...tideDtTimestamps, ...forecastTs])
		).sort((a, b) => a - b)

		// 3. 创建对齐后的实况数据和预报数据数组
		const alignedSurgeList = mergedTimestamps.map((timestamp) =>
			dtTimestamps.includes(timestamp) ? surgeList[dtTimestamps.indexOf(timestamp)] : null
		)

		const alignedTideList = mergedTimestamps.map((timestamp) =>
			tideDtTimestamps.includes(timestamp)
				? tideList[tideDtTimestamps.indexOf(timestamp)]
				: null
		)

		const alignedDiffSurgeList = mergedTimestamps.map((timestamp) =>
			dtTimestamps.includes(timestamp) ? diffSurgeList[dtTimestamps.indexOf(timestamp)] : null
		)

		const alignedForecastSurgeList = mergedTimestamps.map((timestamp) =>
			forecastTs.includes(timestamp) ? forecastVals[forecastTs.indexOf(timestamp)] : null
		)

		// 4. 返回结果
		return {
			mergedTimestamps,
			alignedSurgeList,
			alignedTideList,
			alignedDiffSurgeList,
			alignedForecastSurgeList,
		}
	}

	/** + 23-03-30 加载当前 code 的指定时间范围内的 [start,end] 的潮位数据并初始化 charts*/
	async loadTargetStationSurgeRealDataList(
		code: string,
		start: Date,
		current: Date,
		end: Date
	): Promise<{
		surgeList: number[]
		tideList: number[]
		diffSurgeList: number[]
		dtList: Date[]
		tideDtList: Date[]
	}> {
		const that = this
		this.isLoading = true
		/** 时间集合 */
		let dtList: Date[] = []
		/** 不同的实况总潮位 */
		let surgeRealDataList: Array<number | null> = []
		/** 不同的实况-天文潮=增水集合 */
		let diffSurgeRealDataList: Array<number | null> = []
		// 实况时间范围为 [start,current]
		const surgeDelayedData = await loadTargetStationSurgeRealdataList(
			code,
			start,
			current
		).then(
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
				/** 与时间集合相对应的潮位集合 */
				let surgeList: Array<number | null> = []
				res.data.forEach((element) => {
					dtList.push(new Date(element.gmt_realtime))
					let tempSurge = null
					if (!new Set(DEFAULT_VAL_LIST).has(element.surge)) {
						tempSurge = Number(element.surge.toFixed(2))
					}
					surgeList.push(tempSurge)
				})
				surgeRealDataList = surgeList
				// that.dtList = []
				// that.surgeList = []
				// that.dtList = dtList
				// that.surgeList = surgeList
				// that.yAxisMax = Math.max(...surgeList)
				// const noNanList = surgeList.filter((val) => {
				// 	return val != null
				// })
				// that.yAxisMin = Math.min(...noNanList)
				return surgeList
			}
		)
		/** 天文潮集合对应的时间集合 */
		let tideDtList: Date[] = []
		// TODO:[-] 24-12-12 天文潮时间为 [start,end]
		const tideDelayedData = await loadTargetStationTideRealdataList(code, start, end).then(
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
				let tideList: Array<number | null> = []
				res.data.forEach((element) => {
					let tempTide = null
					if (!new Set(DEFAULT_VAL_LIST).has(element.surge)) {
						tempTide = Number(element.surge.toFixed(2))
					}
					tideDtList.push(new Date(element.gmt_realtime))
					tideList.push(tempTide)
				})
				return tideList
			}
		)

		await Promise.all([surgeDelayedData, tideDelayedData])

		/** 不同的实况-天文潮=增水集合 */
		let diffTideList: Array<number | null> = []
		// 求 surge -tide 的差值集合
		for (let index = 0; index < surgeDelayedData.length; index++) {
			if (
				surgeDelayedData[index] !== DEFAULT_SURGE_VAL &&
				tideDelayedData[index] !== DEFAULT_SURGE_VAL &&
				surgeDelayedData[index] !== null &&
				tideDelayedData[index] !== null
			) {
				diffTideList.push(
					Number((surgeDelayedData[index] - tideDelayedData[index]).toFixed(2))
				)
			} else {
				diffTideList.push(null)
			}
		}

		diffSurgeRealDataList = diffTideList
		return {
			surgeList: surgeRealDataList,
			tideList: tideDelayedData,
			diffSurgeList: diffSurgeRealDataList,
			dtList: dtList,
			tideDtList: tideDtList,
		}
	}

	/** TODO:[-] 24-12-06 加载指定位置的预报数据集
	 * TODO:[*] 24-12-12 返回的 forecastTsList 长度为 7d
	 */
	async loadTargetPositionSurgeForecastDataList(
		lat: number,
		lon: number,
		issueTs: number,
		startTs: number,
		endTs: number
	): Promise<{
		forecastTsList: number[]
		forecastValList: number[]
	}> {
		/** 预报时间戳集合 */
		let forecastTsList: number[] = []

		/** 预报增水值集合 */
		let forecastValList: number[] = []
		await loadTargetPositionSurgeForecastdataList(
			new L.LatLng(lat, lon),
			issueTs,
			startTs,
			endTs
		).then(
			(
				res: IHttpResponse<{
					vals: number[]
					timestamp_list: number[]
				}>
			) => {
				if (res.status === 200) {
					forecastTsList = []
					forecastValList = []
					forecastTsList = [...res.data.timestamp_list]
					forecastValList = [...res.data.vals]
				}
			}
		)
		return {
			forecastTsList: forecastTsList,
			forecastValList: forecastValList,
		}
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
		loadStaionRegionCountry(code)
			.then(
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
			.catch((err) => {
				this.$log.error(`执行 loadStaionRegionCountry 出错!:${err}`)
			})
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
			/** 曲线相关设置，根据:yVals 读取；并根据 scale 进行线性颜色取值 */
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
			/** area填色相关设置, 根据 areaVals 读取;为固定颜色 */
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
						 * html
						  '2024-12-18 06:00<br />undefined:-<br />undefined:2.92<br />undefined:0.04<br />增水						  :-<br />'
						  params[1].seriesName
						  '天文潮'
						  params[2].seriesName
						  '预报增水值'
						  params[3].seriesName
						  'surge'
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

	/** 判断chart 选项中参数是否符合标准规范 */
	checkChartOptsStandards(code: string, issueTs: number, startDt: Date, endDt: Date) {
		let isStandard = false
		if (
			code != DEFAULT_STATION_CODE &&
			issueTs != DEFAULT_TIMESTAMP &&
			startDt != DEFAULT_DATE &&
			endDt != DEFAULT_DATE
		) {
			isStandard = true
		}
		return isStandard
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

	@Getter(GET_GLOBAL_SURGE_ISSUE_TS, { namespace: 'surge' }) getGlobalIssueTs: number

	/** 获取当前 station position latlng */
	@Getter(GET_TARGET_POSITION_LATLNG, { namespace: 'station' }) getPositionLatlng: L.LatLng

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
	get chartOpts(): {
		getStationCode: string
		getGlobalIssueTs: number
		startDt: Date
		currentDt: Date
		endDt: Date
	} {
		const { getStationCode, startDt, currentDt, endDt, getGlobalIssueTs } = this
		return {
			getStationCode,
			getGlobalIssueTs,
			startDt,
			currentDt,
			endDt,
		}
	}

	@Watch('chartOpts')
	onChartOpts(val: {
		getStationCode: string
		getGlobalIssueTs: number
		startDt: Date
		currentDt
		endDt: Date
	}): void {
		// this.loadTargetStationSurgeDataList(val.getStationCode, val.startDt, val.endDt)
		// this.loadTargetPositionSurgeForecastdataList(
		// 	this.getPositionLatlng.lat,
		// 	this.getPositionLatlng.lng,
		// 	val.getGlobalIssueTs
		// )

		// TODO:[-] 24-12-10 此处加入标准化判断
		if (
			this.checkChartOptsStandards(
				val.getStationCode,
				val.getGlobalIssueTs,
				val.startDt,
				val.endDt
			)
		) {
			this.initTargetPositionDataList(
				val.getStationCode,
				this.getPositionLatlng,
				val.startDt,
				val.currentDt,
				val.endDt,
				val.getGlobalIssueTs
			)

			this.loadStationRegionCountry(val.getStationCode)
		}
	}

	get currentDt(): Date {
		return this.getForecastDt
	}

	get endDt(): Date {
		const end = moment(this.getForecastDt).add(this.END_TIME_INTERVAL, 's')
		return end.toDate()
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
	// TODO:[*] 24-12-10 此处测试后需要改为 100%
	width: 1024px;
	// width: 100%;
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
		padding: 5px;
		margin: 5px;
		display: flex;
		// flex: 5;
		flex-direction: column;
		div.down-section {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
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
.down-section {
	display: flex;
	flex-direction: column;
	align-items: center;
}
</style>
