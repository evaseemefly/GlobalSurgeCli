<template>
	<div
		id="wave_dir_table"
		v-loading="isLoading"
		element-loading-background="rgba(28, 34, 52, 0.733)"
	>
		<section>
			<div class="wave-table-legend">
				<div class="table-legend-row table-legend-title">
					<div class="legend-title">时间</div>
					<div class="legend-unit">h</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">总潮位</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">天文潮</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">增水</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">风速</div>
					<div class="legend-unit">m/s</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">风向</div>
					<div class="legend-unit">.</div>
				</div>
			</div>
		</section>
		<table>
			<thead class="thead-dark">
				<tr>
					<th
						scope="col"
						v-for="(item, index) in forecastDtList"
						:key="index"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
					>
						{{ item | formatDate2DayHM }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in totalSurgeList"
						:key="index"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
						:style="{ background: toAlertColor(item) }"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in tideList"
						:key="index"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in surgeList"
						:key="index"
						:style="{ background: surge2Color(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in limitWsList"
						:key="index"
						:style="{ background: wind2Color(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in limitWdList"
						:key="index"
						:style="{ background: wind2Color(limitWsList[index]) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						<div
							class="row-arrow"
							v-show="item !== -9999"
							:style="{ transform: 'rotate(' + item + 'deg)' }"
						>
							<i class="fa-solid fa-arrow-up"></i>
						</div>
						<span v-show="item == -9999">-</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
	formatDir2Int,
	formatSurgeFixed2Str,
	filterSurgeColorStr,
	filterWindColorStr,
	formatDate2DayHM,
	formatTs2DayHM,
	filterAlertSurgeColorStr,
} from '@/util/filter'
import { DEFAULT_SURGE_TD_STEP, DEFAULT_VAL } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { MS_UNIT } from '@/const/unit'
/** 风暴潮 tab */
@Component({ filters: { formatDir2Int, formatSurgeFixed2Str, formatDate2DayHM, formatTs2DayHM } })
export default class SurgeValsTableInLand extends Vue {
	MAX_SPLIT_LIST_COUNT = 24
	MAX_WS_COUNT = 168
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	/** 起始时间戳 */
	@Prop({ type: Number })
	startTs: number

	/** 结束时间戳 */
	@Prop({ type: Number })
	endTs: number

	/** 总潮位 */
	// @Prop({ type: Array, default: [] })
	// surgeList: number[]

	/** 天文潮位 */
	@Prop({ type: Array, default: [] })
	tideList: number[]

	/** 增水 */
	@Prop({ type: Array, default: [] })
	surgeList: number[]

	/** 风速集合 */
	@Prop({ type: Array, default: [] })
	wsList: number[]

	/** 风向集合  */
	@Prop({ type: Array, default: [] })
	wdList: number[]

	/** 风速时间戳集合 */
	@Prop({ type: Array, default: [] })
	wsTsList: number[]

	/** 当前 code 对应的警戒潮位 */
	@Prop({ type: Array, default: [] })
	alertLevels: { tide: number; alert: AlertTideEnum }[]

	/** 对应的预报时间戳集合 */
	@Prop({ type: Array, default: [] })
	forecastDtList: { val: Date }[]

	/** 潮位 table 中的 td 之间的时间间隔(h) */
	@Prop({ type: Number, default: DEFAULT_SURGE_TD_STEP })
	surgeTdStep: number

	@Prop({ type: Number, default: 0 })
	propHoverIndex: number

	/** 根据 splitWsList 最大风速出现的时间获取的风向
	 * * 不再使用
	 */
	splitWdList: number[] = []

	/** 根据 splitWsList 最大风速出现的时间集合
	 * * 不再使用
	 */
	splitWsTsList: number[] = []

	/** 风速极值出现的时间集合
	 * * 不再使用
	 */
	splitWsMaxDateList: Date[] = []

	/** 切分后的风速集合
	 * *不再使用
	 * */
	get splitWsList(): number[] {
		/**
		 * 从 wsList 根据 splitCellStep提取对应的极值，并获取对应的index，并提取 splitWdList
		 */
		let splittedWsList: number[] = []
		let splittedWdList: number[] = []
		let splittedTsList: number[] = []
		const newWsList: number[] = this.wsList.slice(0, this.MAX_WS_COUNT)
		const newWdList: number[] = this.wdList.slice(0, this.MAX_WS_COUNT)
		const newTsList: number[] = this.wsTsList.slice(0, this.MAX_WS_COUNT)

		/** 根据 splitCellStep 切分后的数组的长度 */
		const splitCellCount: number =
			Math.floor(newWsList.length / this.splitCellStep) <= this.MAX_SPLIT_LIST_COUNT
				? Math.floor(newWsList.length / this.splitCellStep)
				: this.MAX_SPLIT_LIST_COUNT
		if (this.wsList.length == 0) {
			splittedWsList = Array.from({ length: this.MAX_WS_COUNT }).map((_) => {
				return DEFAULT_VAL
			})
			splittedWdList = [...splittedWsList]
		}
		for (let index = 0; index < splitCellCount; index++) {
			// 从数组中提取极值
			/** 当前的累计风速数组 */

			const splitWsList = newWsList.slice(
				index * this.splitCellStep,
				(index + 1) * this.splitCellStep
			)

			const splitWdList = newWdList.slice(
				index * this.splitCellStep,
				(index + 1) * this.splitCellStep
			)

			const splitTsList = newTsList.slice(
				index * this.splitCellStep,
				(index + 1) * this.splitCellStep
			)

			const tempMaxWs: number = Math.max(...splitWsList)
			const tempMaxWsIndex: number = splitWsList.findIndex((temp) => {
				return temp === tempMaxWs
			})
			const tempMaxWd: number = Math.ceil(splitWdList[tempMaxWsIndex])
			const tempWsMaxTs: number = splitTsList[tempMaxWsIndex]
			splittedWsList.push(tempMaxWs)
			splittedWdList.push(tempMaxWd)
			splittedTsList.push(tempWsMaxTs)
		}
		this.splitWdList = splittedWdList
		this.splitWsTsList = splittedTsList
		return splittedWsList
	}

	/** 起止时间戳的间隔(单位:s) */
	get splitTs(): number {
		return this.endTs - this.startTs
	}

	/** 提取的索引间隔步长 */
	get splitCellStep(): number {
		const diffTs: number = this.endTs - this.startTs
		const HOUR: number = 60 * 60
		const hours: number = diffTs / HOUR
		let splitStep = 1
		switch (hours) {
			case 48:
				splitStep = 2
				break
			case 72:
				splitStep = 3
				break
			case 96:
				splitStep = 4
				break
			case 168:
				splitStep = 7
				break
			default:
				splitStep = 1
		}
		return splitStep
	}

	// baseColorStr: '#153C83'

	/** 当前移入的index索引 */
	hoverIndex = 0

	toRotate(val: number): string {
		let rotateStr = `rotate(${val}}deg);`
		return rotateStr
	}

	toSetHoverIndex(index: number): void {
		this.hoverIndex = index
	}

	/** 根据增水获取对应的线性色标中对应的颜色 */
	surge2Color(val: number): string {
		return filterSurgeColorStr(val)
	}

	/** 根据风速获取对应的线性色标中对应的颜色 */
	wind2Color(val: number): string {
		return filterWindColorStr(val)
	}

	/** 获取当前潮值对应的警戒颜色 */
	toAlertColor(val: number): string {
		/** 升序排列的 警戒潮位潮值集合 */
		const alertTides: number[] = this.alertLevels
			.map((temp) => {
				return temp.tide
			})
			.sort((a, b) => {
				return a - b
			})
		return filterAlertSurgeColorStr(val, alertTides)
	}

	@Watch('propHoverIndex')
	onPropHoverIndex(val: number): void {
		this.hoverIndex = val
	}

	/** + 23-08-22 添加了监听传入的时间偏移量 */
	// @Watch('offsetNum')
	// onOffsetNum(val: number): void {
	// 	this.surgeList = this.surgeList.slice(0 + val, this.surgeList.length)
	// }
	/** TODO:[-] 23-08-24 修改总潮位为动态计算 */
	// get splitSurgeList(): number[] {
	// 	let surgeList: number[] = []
	// 	for (let index = 0; index < this.surgeList.length / this.splitCellStep; index++) {
	// 		const startIndex = index * this.splitCellStep
	// 		const endIndex = (index + 1) * this.splitCellStep
	// 		const sliceList: number[] = this.surgeList.slice(startIndex, endIndex)
	// 		const tempSplitMax = Math.max(...sliceList)
	// 		surgeList.push(tempSplitMax)
	// 	}
	// 	return surgeList
	// }

	/** 切分后的总潮位集合 */
	// get splitTotalSurgeList(): number[] {
	// 	let surgeList: number[] = []
	// 	this.splitTideList = []
	// 	this.splitDiffSurgeList = []
	// 	this.splitForecastDtList = []

	// 	for (let index = 0; index < this.totalSurgeList.length / this.splitCellStep; index++) {
	// 		const startIndex = index * this.splitCellStep
	// 		const endIndex = (index + 1) * this.splitCellStep
	// 		const sliceList: number[] = this.totalSurgeList.slice(startIndex, endIndex)
	// 		const tempSplitMax = Math.max(...sliceList)
	// 		const tempMaxSurgeIndex: number = this.totalSurgeList.findIndex((temp) => {
	// 			return temp === tempSplitMax
	// 		})

	// 		surgeList.push(tempSplitMax)
	// 		this.splitTideList.push(this.tideList[tempMaxSurgeIndex])
	// 		this.splitDiffSurgeList.push(this.surgeList[tempMaxSurgeIndex])
	// 		this.splitForecastDtList.push(this.forecastDtList[tempMaxSurgeIndex])
	// 	}
	// 	return surgeList
	// }

	get totalSurgeList(): number[] {
		let total: number[] = this.surgeList.map((val, index) => {
			return val + this.tideList[index]
		})
		return total
	}

	// splitForecastDt: Date[] = []

	/** 切分后的天文潮集合 */
	splitTideList: number[] = []

	// get splitTideList(): number[] {
	// 	let surgeList: number[] = []
	// 	for (let index = 0; index < this.tideList.length / this.splitCellStep; index++) {
	// 		const startIndex = index * this.splitCellStep
	// 		const endIndex = (index + 1) * this.splitCellStep
	// 		const sliceList: number[] = this.tideList.slice(startIndex, endIndex)
	// 		const tempSplitMax = Math.max(...sliceList)
	// 		surgeList.push(tempSplitMax)
	// 	}
	// 	return surgeList
	// }

	/** 切分后的增水集合 */
	splitDiffSurgeList: number[] = []
	// get splitDiffSurgeList(): number[] {
	// 	let surgeList: number[] = []
	// 	for (let index = 0; index < this.surgeList.length / this.splitCellStep; index++) {
	// 		const startIndex = index * this.splitCellStep
	// 		const endIndex = (index + 1) * this.splitCellStep
	// 		const sliceList: number[] = this.surgeList.slice(startIndex, endIndex)
	// 		const tempSplitMax = Math.max(...sliceList)

	// 		surgeList.push(tempSplitMax)
	// 	}
	// 	return surgeList
	// }

	// get splitForecastDtList(): { val: Date }[] {
	// 	let dtList: { val: Date }[] = []
	// 	for (let index = 0; index < this.forecastDtList.length / this.splitCellStep; index++) {
	// 		const tempSplitMax = this.forecastDtList[index * this.splitCellStep]

	// 		dtList.push(tempSplitMax)
	// 	}
	// 	return dtList
	// }

	/** 限制长度后及对空数组填充'-'的限制风速集合 */
	get limitWsList(): number[] {
		let splittedWsList: number[] = []
		if (this.wsList.length == 0) {
			splittedWsList = Array.from({ length: this.MAX_WS_COUNT }).map((_) => {
				return DEFAULT_VAL
			})
		} else {
			splittedWsList = this.wsList.slice(0, this.MAX_WS_COUNT)
		}
		return splittedWsList
	}

	/** 限制长度后及对空数组填充'-'的限制风向集合 */
	get limitWdList(): number[] {
		let splittedWdList: number[] = []
		if (this.wdList.length == 0) {
			splittedWdList = Array.from({ length: this.MAX_WS_COUNT }).map((_) => {
				return DEFAULT_VAL
			})
		} else {
			splittedWdList = this.wdList.slice(0, this.MAX_WS_COUNT)
		}
		return splittedWdList
	}

	/** 不再使用 */
	splitForecastDtList: { val: Date }[] = []
}
</script>
<style scoped lang="less">
#wave_dir_table {
	display: flex;
	max-width: 1042px;
	overflow-x: auto;
	overflow-y: hidden;
	section {
		.wave-table-legend {
			color: white;
			.table-legend-row {
				display: flex;
				align-content: center;
				align-items: center;
				justify-content: space-between;
				// height: 20px;
				width: 60px;
				.legend-title {
					width: 50px;
				}
			}
		}
		.table-legend-title {
			height: 30px;
			margin: 2px;
		}
		.table-legend-item {
			height: 20px;
			margin: 1px;
		}
	}

	table {
		.activate {
			background: #1fdbb6e0 !important;
		}
		thead {
			height: 20px;
			tr {
				th {
					color: white;
					width: 20px;
				}
			}
		}
		tbody {
			tr {
				height: 20px;
				width: 20px;
			}
		}
	}
}
table {
	width: 100%;
}
th {
	color: white;
}
td {
	color: white;
}
.row-arrow {
	color: white;
}
</style>
