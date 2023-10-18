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
						:style="{ background: baseColorStr }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
						<!-- <div :style="{ transform: toRotate(item) }">
							<i class="fa-solid fa-arrow-up"></i>
						</div> -->
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in splitTideList"
						:key="index"
						:style="{ background: baseColorStr }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
						<!-- <div :style="{ transform: toRotate(item) }">
							<i class="fa-solid fa-arrow-up"></i>
						</div> -->
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
						<!-- <div :style="{ transform: toRotate(item) }">
							<i class="fa-solid fa-arrow-up"></i>
						</div> -->
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
} from '@/util/filter'
import { DEFAULT_SURGE_TD_STEP } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
/** 风暴潮 tab */
@Component({ filters: { formatDir2Int, formatSurgeFixed2Str, formatDate2DayHM } })
export default class SurgeTableView extends Vue {
	@Prop({ type: Array, default: [] })
	surgeList: { val: number }[]

	/** 天文潮位 */
	@Prop({ type: Array, default: [] })
	tideList: { val: number }[]

	/** 实况-天文潮 */
	@Prop({ type: Array, default: [] })
	diffSurgeList: { val: number }[]

	/** 当前 code 对应的警戒潮位 */
	@Prop({ type: Array, default: [] })
	alertLevels: { stationCode: string; tide: number; alert: AlertTideEnum }[]

	@Prop({ type: Array, default: [] })
	forecastDtList: { val: Date }[]

	/** 潮位 table 中的 td 之间的时间间隔(h) */
	@Prop({ type: Number, default: DEFAULT_SURGE_TD_STEP })
	surgeTdStep: number

	@Prop({ type: Number, default: 0 })
	propHoverIndex: number

	baseColorStr: '#153C83'

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

	@Watch('propHoverIndex')
	onPropHoverIndex(val: number): void {
		this.hoverIndex = val
	}

	get splitSurgeList(): { val: number }[] {
		let surgeList: { val: number }[] = []
		for (let index = 0; index < this.surgeList.length; index++) {
			if (index === 0 || index % this.surgeTdStep === 0) {
				surgeList.push(this.surgeList[index])
			}
		}
		return surgeList
	}

	get splitTideList(): { val: number }[] {
		let surgeList: { val: number }[] = []
		for (let index = 0; index < this.tideList.length; index++) {
			if (index === 0 || index % this.surgeTdStep === 0) {
				surgeList.push(this.tideList[index])
			}
		}
		return surgeList
	}

	get splitDiffSurgeList(): { val: number }[] {
		let surgeList: { val: number }[] = []
		for (let index = 0; index < this.diffSurgeList.length; index++) {
			if (index === 0 || index % this.surgeTdStep === 0) {
				surgeList.push(this.diffSurgeList[index])
			}
		}
		return surgeList
	}

	get splitForecastDtListList(): { val: Date }[] {
		let dtList: { val: Date }[] = []
		for (let index = 0; index < this.forecastDtList.length; index++) {
			if (index === 0 || index % this.surgeTdStep === 0) {
				dtList.push(this.forecastDtList[index])
			}
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
