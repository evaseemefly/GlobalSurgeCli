<template>
	<div id="wave_dir_table">
		<section>
			<div class="wave-table-legend">
				<div class="table-legend-row">
					<div class="legend-title">时间</div>
					<div class="legend-unit">h</div>
				</div>
				<div class="table-legend-row">
					<div class="legend-title">平均波高</div>
					<div class="legend-unit">m</div>
				</div>
				<div class="table-legend-row">
					<div class="legend-title">风浪波高</div>
					<div class="legend-unit">m</div>
				</div>
				<!-- <div class="table-legend-row">
					<div class="legend-title">平均周期</div>
					<div class="legend-unit">s</div>
				</div> -->
				<div class="table-legend-row">
					<div class="legend-title">平均波向</div>
					<div class="legend-unit"></div>
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
						{{ index * 6 }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in swhList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatDir2Int }}
						<!-- <div :style="{ transform: toRotate(item) }">
							<i class="fa-solid fa-arrow-up"></i>
						</div> -->
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in shwwList"
						:key="index"
						:style="{ background: toColor(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatDir2Int }}
						<!-- <div :style="{ transform: toRotate(item) }">
							<i class="fa-solid fa-arrow-up"></i>
						</div> -->
					</td>
				</tr>
				<!-- <tr>
					<td scope="col" v-for="(item, index) in mwpList" :key="index">
						{{ item | formatDir2Int }}
					</td>
				</tr> -->
				<tr>
					<td
						scope="col"
						v-for="(item, index) in mwdList"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						:key="index"
					>
						<!-- 此种方式不会渲染 style -->
						<!-- <div :style="{ transform: toRotate(item) }"> -->
						<div class="row-arrow" :style="{ transform: 'rotate(' + item + 'deg)' }">
							<i class="fa-solid fa-arrow-up"></i>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { formatDir2Int, filterWaveColor } from '@/util/filter'
/** 海浪 */
@Component({ filters: { formatDir2Int } })
export default class WaveVasTableView extends Vue {
	/** 平均波向 */
	@Prop({ type: Array, default: [] })
	mwdList: { val: number }[]

	/** 平均波周期 */
	@Prop({ type: Array, default: [] })
	mwpList: { val: number }[]

	/** 平均波高  */
	@Prop({ type: Array, default: [] })
	swhList: { val: number }[]

	/** 风浪波高 */
	@Prop({ type: Array, default: [] })
	shwwList: { val: number }[]

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

	toColor(val: number): string {
		return filterWaveColor(val)
	}

	@Watch('propHoverIndex')
	onPropHoverIndex(val: number): void {
		this.hoverIndex = val
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
				height: 20px;
				width: 60px;
				.legend-title {
					width: 50px;
				}
			}
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
