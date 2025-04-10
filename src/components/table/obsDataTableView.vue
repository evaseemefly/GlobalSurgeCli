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
					<div class="legend-title">实况增水</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">预报增水</div>
					<div class="legend-unit">cm</div>
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
						:style="{ background: surge2Color(item) }"
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
						v-for="(item, index) in forecastValList"
						:key="index"
						:style="{ background: surge2Color(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
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
	formatSurgeFiexIntStr,
	formatSurgeFiex1NumStr,
	filterSurgeColorStr,
	filterWindColorStr,
	formatDate2DayHM,
	formatSurgeFixed2Str,
	formatTs2DayHM,
	filterAlertSurgeColorStr,
} from '@/util/filter'
import { DEFAULT_SURGE_TD_STEP, DEFAULT_VAL, DEFAULT_VAL_LIST } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { MS_UNIT } from '@/const/unit'
/** 风暴潮 tab */
@Component({
	filters: {
		formatDir2Int,
		formatSurgeFiexIntStr,
		formatSurgeFiex1NumStr,
		formatSurgeFixed2Str,
		formatDate2DayHM,
		formatTs2DayHM,
	},
})
export default class ObsDataTableView extends Vue {
	MAX_SPLIT_LIST_COUNT = 240
	MAX_WS_COUNT = 240
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	/** 总潮位 */
	// @Prop({ type: Array, default: [] })
	// surgeList: number[]

	/** 天文潮位 */
	@Prop({ type: Array, default: [] })
	tideList: number[]

	/** 增水 */
	@Prop({ type: Array, default: [] })
	surgeList: number[]

	/** 预报增水值列表 */
	@Prop({ type: Array, default: [] })
	forecastValList: number[]

	/** 对应的预报时间戳集合 */
	@Prop({ type: Array, default: [] })
	forecastDtList: { val: Date }[]

	@Prop({ type: Number, default: 0 })
	propHoverIndex: number

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
		const scalerRange: number[] = [0.5, 1, 1.5, 2, 2.5]
		return filterSurgeColorStr(val, scalerRange)
	}

	@Watch('propHoverIndex')
	onPropHoverIndex(val: number): void {
		this.hoverIndex = val
	}

	get totalSurgeList(): (number | null)[] {
		let total: (number | null)[] = this.surgeList.map((val, index) => {
			if (val !== null && this.tideList[index] != null) {
				return val + this.tideList[index]
			} else {
				return null
			}
		})
		return total
	}
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
