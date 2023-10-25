<template>
	<div id="station_alert_list" v-loading="isLoading" element-loading-background="loadBackground">
		<div class="form-header">
			<h4>站点总潮位极值集合</h4>
			<!-- <div class="primary-title"></div> -->
			<span></span>

			<!-- <div class="desc"></div> -->
		</div>
		<section>
			<table>
				<thead>
					<tr>
						<th>站点名称</th>
						<th>总潮位极值</th>
						<th>时间</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(stationTemp, index) in stationExtremumMergeList"
						:key="stationTemp.id"
						@click="commitStationExtremum(stationTemp, index)"
						:class="index == selectedTrIndex ? 'activate' : ' '"
					>
						<td>{{ stationTemp.stationName }}</td>
						<td class="null-color">
							<TideValuePrgressLineView
								:realdata="stationTemp.realdata"
								:lineWidth="84"
								:alertTides="stationTemp.alerts"
							></TideValuePrgressLineView>
						</td>
						<td>{{ stationTemp.dt | fortmatData2MDHM }}</td>
					</tr>
				</tbody>
			</table>
		</section>
		<div class="form-footer"></div>
	</div>
</template>
<script lang="ts">
import { List } from 'echarts'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
// 工具类
import { fortmatData2MDHM, filterSurgeAlarmColor, filterStationNameCh } from '@/util/filter'
// 其他组件
import TideValuePrgressLineView from '@/components/progress/tideValueProgressView.vue'
import { AlertTideEnum } from '@/enum/surge'
import {
	loadDistStationsAlertLevelList,
	loadStationAlertLevelDataList,
	loadStationExtremumRealDataist,
} from '@/api/station'
import { IHttpResponse } from '@/interface/common'
import {
	SET_COMPLEX_OPTS_CURRENT_STATION,
	SET_CURRENT_TY_FORECAST_DT,
	SET_SHADE_NAV_TIME,
	SET_STATION_CODE,
} from '@/store/types'
import { MS_UNIT } from '@/const/unit'
import { NONE_STATION_NAME } from '@/const/default'

@Component({
	filters: {
		fortmatData2MDHM,
		filterSurgeAlarmColor,
	},
	components: {
		TideValuePrgressLineView,
	},
})
export default class StationAlertListView extends Vue {
	/** 需要获取的站点codes数组 */
	@Prop({ type: Array, required: false })
	stationCodes: string[]

	/** 总潮位集合 */
	@Prop({ default: [], type: Array })
	distStationsTotalSurgeList: {
		station_code: string
		sort: number
		forecast_ts_list: number[]
		tide_list: number[]
		surge_list: number[]
	}[]

	stationExtremumList: {
		stationCode: string
		stationName: string
		/** 增水=实况-天文潮 */
		surge: number
		dt: Date
		/** 实况 */
		realdata: number
		/** 天文潮 */
		tide: number
	}[] = []

	stationExtremumMergeList: {
		stationCode: string
		stationName: string
		surge: number
		dt: Date
		code: string
		name_en: string
		alerts: { code: string; alert: AlertTideEnum; tide: number }[]
	}[] = []

	/** 海洋站名称中英文对照字典 */
	@Prop({ type: Array, required: true })
	stationNameDict: { name: string; chname: string; sort: number }[]

	isLoading = false

	/** 当前选中的行序号 */
	selectedTrIndex = -1

	/** 页面加载时的背景颜色 */
	loadBackground = '#20262cd9'

	mounted() {
		this.loadDistStationAlertList()
	}

	get maxVal(): number {
		return Math.max(
			...this.stationExtremumList.map((temp) => {
				return temp.realdata
			})
		)
	}

	@Watch('distStationsTotalSurgeList')
	onDistStationsTotalSurgeList(
		val: {
			station_code: string
			sort: number
			forecast_ts_list: number[]
			tide_list: number[]
			surge_list: number[]
		}[]
	): void {
		const codes: string[] = val.map((temp) => {
			return temp.station_code
		})
		loadDistStationsAlertLevelList().then((alert) => {
			if (alert.status == 200) {
				/** 
				 * alert_level_list: (4) [5001, 5002, 5003, 5004]
					alert_tide_list: (4) [571, 596, 621, 646]
					station_code: "AJS"
				 */
				// 将海洋站极值集合与四色警戒潮位集合merge
				let stationExtreMergeList = []
				val.forEach((tempTide) => {
					const filterRes = alert.data.filter((temp) => {
						return temp.station_code == tempTide.station_code
					})
					if (filterRes.length > 0) {
						// TODO:[-] 23-08-21 找到 增水极值
						/** 总潮位集合 */
						const totalSurgeList: number[] = []
						for (let index = 0; index < tempTide.surge_list.length; index++) {
							totalSurgeList.push(
								tempTide.surge_list[index] + tempTide.tide_list[index]
							)
						}
						let tempStationFilter = this.stationNameDict.filter((x) => {
							return x.name == tempTide.station_code
						})
						let tempStationName: string =
							tempStationFilter.length > 0
								? tempStationFilter[0].chname
								: NONE_STATION_NAME
						// 找到总潮位极值所在位置
						/** 总潮位极值位置 */
						let maxIndex = 0
						totalSurgeList.reduce((accuVal, currentVal, currentIndex) => {
							if (accuVal > currentVal) {
								return accuVal
							} else {
								maxIndex = currentIndex
								return currentVal
							}
						})
						const tempBaseInfo = {
							// surge: totalSurgeList,
							code: tempTide.station_code,
							stationName: tempStationName,
							realdata: totalSurgeList[maxIndex],
							tide: tempTide.tide_list[maxIndex],
							surge: tempTide.surge_list[maxIndex],
							dt: new Date(tempTide.forecast_ts_list[maxIndex] * MS_UNIT),
						}
						const targetAlert = filterRes[0]
						const alerts: { code: string; alert: AlertTideEnum; tide: number }[] = []
						for (let index = 0; index < targetAlert.alert_level_list.length; index++) {
							const tempAlertLevel = targetAlert.alert_level_list[index]
							const tempAlertTide = targetAlert.alert_tide_list[index]
							alerts.push({
								code: tempTide.station_code,
								alert: tempAlertLevel,
								tide: tempAlertTide,
							})
						}
						let stationExtremumMerge = {
							alerts: alerts,
							...tempBaseInfo,
							stationCode: tempTide.station_code,
						}
						stationExtreMergeList.push(stationExtremumMerge)
					}
				})
				this.stationExtremumMergeList = stationExtreMergeList
			}
		})
	}

	@Watch('stationExtremumList')
	onStationExtremumList(
		val: {
			stationCode: string
			stationName: string
			surge: number
			dt: Date
			/** 实况 */
			realdata: number
			/** 天文潮 */
			tide: number
		}[]
	): void {
		const codes: string[] = val.map((temp) => {
			return temp.stationCode
		})

		loadStationAlertLevelDataList(codes).then(
			(
				res: IHttpResponse<
					{
						code: string
						name_en: string
						alerts: { code: string; alert: number; tide: number }[]
					}[]
				>
			) => {
				if (res.status === 200) {
					/**
					 * {
						"code": "BAO",
						"name_en": "BOAO",
						"alerts": [
							{
								"code": "BAO",
								"alert": 5001,
								"tide": 255
							},
						…]
						}
				 	*/
					// 将海洋站极值集合与四色警戒潮位集合merge
					let stationExtreMergeList = []
					val.forEach((tempTide) => {
						const filterRes = res.data.filter((temp) => {
							return temp.name_en == tempTide.stationCode
						})
						if (filterRes.length > 0) {
							const targetAlert = filterRes[0]
							let stationExtremumMerge = { ...targetAlert, ...tempTide }
							stationExtreMergeList.push(stationExtremumMerge)
						}
					})
					this.stationExtremumMergeList = stationExtreMergeList
				}
			}
		)
	}

	loadDistStationAlertList() {
		loadDistStationsAlertLevelList().then((alert) => {
			if (alert.status == 200) {
				/** 
				 * alert_level_list: (4) [5001, 5002, 5003, 5004]
					alert_tide_list: (4) [571, 596, 621, 646]
					station_code: "AJS"
				 */
				console.log(alert.data)
			}
		})
	}

	/** 提交选中的 海洋站极值info */
	commitStationExtremum(
		val: {
			stationName: string
			stationCode: string
			surge: number
			dt: Date
		},
		index: number
	): void {
		// console.log(val)
		this.setStationCode(val.stationCode)
		this.setTyForecastDt(val.dt)
		this.setShadeTimebar(false)
		this.selectedTrIndex = index
	}

	/** 设置当前选中的 海洋站code */
	@Mutation(SET_STATION_CODE, { namespace: 'station' })
	setStationCode: { (val: string): void }

	/** 设置当前选中的 台风预报时刻 */
	@Mutation(SET_CURRENT_TY_FORECAST_DT, { namespace: 'typhoon' })
	setTyForecastDt: { (val: Date): void }

	/** 设置当前海洋站复杂配置 */
	@Mutation(SET_COMPLEX_OPTS_CURRENT_STATION, { namespace: 'complex' })
	setStationComplexOpts: {
		(val: { tyNum: string; tyCode: string; stationName: string; stationCode: string }): void
	}

	/** 设置 遮罩 timebar */
	@Mutation(SET_SHADE_NAV_TIME, { namespace: 'common' }) setShadeTimebar
}
</script>
<style scoped lang="less">
@import url('../../styles/base-form.less');
#station_alert_list {
	margin: 5px;
	// 统一的 shadow 效果
	@form-base-shadow();
	// 统一的边角半圆过渡
	@form-base-radius();
	@form-base-background();
	// position: absolute;
	// top: 80px;
	// right: 450px;
	width: 300px;
	// height: 450px;
	// background-color: #20262cd9;
	z-index: 999;
	max-height: 600px;
	.form-header {
		display: flex;
		margin: 5px;
		align-items: center;
		h4 {
			color: white;
			font-size: 1.2rem;
			margin: 10px;
		}
		span {
			display: flex;
			align-items: center;
			color: white;
		}
		// +
		.thumb-btn {
			@form-header-expand();
		}
	}
	section {
		font-size: 13px;
		color: white;
		margin: 5px;
		max-height: 420px;
		overflow: auto;
		// height: 400px;
		// overflow: auto;
		table {
			width: 100%;
			tbody {
				max-height: 250px;
				// @typhoon-legend();
				tr:hover {
					background: #27ae60;
				}
				.activate {
					background: #9b59b6;
				}
			}
		}
	}
}
</style>
