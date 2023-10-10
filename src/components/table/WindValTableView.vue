<template>
	<div id="wave_dir_table">
		<section>
			<div class="wave-table-legend">
				<div class="table-legend-row">
					<div class="legend-title">风向</div>
					<div class="legend-unit">m</div>
				</div>
				<div class="table-legend-row">
					<div class="legend-title">累计风速</div>
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
						v-for="(item, index) in mwdList"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						:key="index"
					>
						<div class="row-arrow" :style="{ transform: 'rotate(' + item + 'deg)' }">
							<i class="fa-solid fa-arrow-up"></i>
						</div>
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in mwdList"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						:key="index"
					>
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
	/** 风速集合 */
	@Prop({ type: Array, default: [] })
	wsList: { val: number }[]

	/** 风向集合  */
	@Prop({ type: Array, default: [] })
	wdList: { val: number }[]

	/** 对应的预报时间戳集合 */
	@Prop({ type: Array, default: [] })
	forecastTsList: { val: Date }[]

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
