<template>
	<div id="wave_dir_table">
		<section>
			<div class="wave-table-legend">
				<div class="table-legend-row table-legend-title">
					<div class="legend-title">时间</div>
					<div class="legend-unit">h</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">实况</div>
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
					<div class="legend-title">累计风速</div>
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
						v-for="(item, index) in splitForecastDtListList"
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
						v-for="(item, index) in splitSurgeList"
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
						v-for="(item, index) in splitTideList"
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
						v-for="(item, index) in splitDiffSurgeList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in splitDiffSurgeList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in splitDiffSurgeList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in splitWsList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in splitWdList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | toRotate }}
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
	formatDate2DayHM,
	filterAlertSurgeColorStr,
} from '@/util/filter'
import { DEFAULT_SURGE_TD_STEP } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { MS_UNIT } from '@/const/unit'
/** 风暴潮 tab */
@Component({ filters: { formatDir2Int, formatSurgeFixed2Str, formatDate2DayHM } })
export default class SurgeValsTableInLand extends Vue {
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

	/** 对应的预报时间戳集合 */
	@Prop({ type: Array, default: [] })
	forecastTsList: { val: Date }[]

	/** 当前 code 对应的警戒潮位 */
	@Prop({ type: Array, default: [] })
	alertLevels: { tide: number; alert: AlertTideEnum }[]

	@Prop({ type: Array, default: [] })
	forecastDtList: { val: Date }[]

	/** 潮位 table 中的 td 之间的时间间隔(h) */
	@Prop({ type: Number, default: DEFAULT_SURGE_TD_STEP })
	surgeTdStep: number

	@Prop({ type: Number, default: 0 })
	propHoverIndex: number

	/** 根据 splitWsList 最大风速出现的时间获取的风向 */
	splitWdList: number[]

	get splitWsList(): number[] {
		/**
		 * 从 wsList 根据 splitCellStep提取对应的极值，并获取对应的index，并提取 splitWdList
		 */

		/** 根据 splitCellStep 切分后的数组的长度 */
		const splitCellCount: number = this.wsList.length / this.splitCellStep
		let splittedWsList: number[] = []
		let splittedWdList: number[] = []
		for (let index = 0; index < splitCellCount; index++) {
			// 从数组中提取极值
			/** 当前的累计风速数组 */

			const splitWsList = this.wsList
				.slice(index * this.splitCellStep, (index + 1) * this.splitCellStep)
				.map((temp) => {
					return temp.val
				})

			const splitWdList = this.wdList
				.slice(index * this.splitCellStep, (index + 1) * this.splitCellStep)
				.map((temp) => {
					return temp.val
				})
			const tempMaxWs: number = Math.max(...splitWsList)
			const tempMaxWsIndex: number = splitWsList.findIndex((temp) => {
				temp === tempMaxWs
			})
			const tempMaxWd: number = splitWdList[tempMaxWsIndex]
			splittedWsList.push(tempMaxWs)
			splittedWdList.push(tempMaxWd)
		}
		this.splitWdList = splittedWdList
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

	toColor(val: number): string {
		return filterSurgeColorStr(val)
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

	get totalSurgeList(): number[] {
		let totalSurgeList: number[] = []
		for (let index = 0; index < this.tideList.length; index++) {
			totalSurgeList.push(this.tideList[index] + this.surgeList[index])
		}
		return totalSurgeList
	}

	get splitSurgeList(): number[] {
		let surgeList: number[] = []

		for (let index = 0; index < this.totalSurgeList.length / this.splitCellStep; index++) {
			const startIndex = index * this.splitCellStep
			const endIndex = (index + 1) * this.splitCellStep
			const sliceList: number[] = this.totalSurgeList.slice(startIndex, endIndex)
			const tempSplitMax = Math.max(...sliceList)
			surgeList.push(tempSplitMax)
		}
		return surgeList
	}

	get splitTideList(): number[] {
		let surgeList: number[] = []
		for (let index = 0; index < this.tideList.length / this.splitCellStep; index++) {
			const startIndex = index * this.splitCellStep
			const endIndex = (index + 1) * this.splitCellStep
			const sliceList: number[] = this.tideList.slice(startIndex, endIndex)
			const tempSplitMax = Math.max(...sliceList)
			surgeList.push(tempSplitMax)
		}
		return surgeList
	}

	get splitDiffSurgeList(): number[] {
		let surgeList: number[] = []
		for (let index = 0; index < this.surgeList.length / this.splitCellStep; index++) {
			const startIndex = index * this.splitCellStep
			const endIndex = (index + 1) * this.splitCellStep
			const sliceList: number[] = this.surgeList.slice(startIndex, endIndex)
			const tempSplitMax = Math.max(...sliceList)

			surgeList.push(tempSplitMax)
		}
		return surgeList
	}

	get splitForecastDtListList(): { val: Date }[] {
		let dtList: { val: Date }[] = []
		for (let index = 0; index < this.forecastDtList.length / this.splitCellStep; index++) {
			const tempSplitMax = this.forecastDtList[index * this.splitCellStep]

			dtList.push(tempSplitMax)
		}
		return dtList
	}
}
</script>
<style scoped lang="less">
#wave_dir_table {
	display: flex;
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
