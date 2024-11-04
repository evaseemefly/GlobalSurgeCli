<template>
	<div class="nav_item_timebar" :class="isShade ? 'is-shade' : ''">
		<el-tooltip class="item" effect="dark" content="预报时间" placement="top">
			<div class="timebar_child">
				<div class="nav_item_icon nav_icon_operator" @click="subDt()">-</div>
				<div>{{ convertDt2Str('YYYY') }}</div>
				<div class="nav_item_icon nav_icon_operator" @click="addDt()">+</div>
			</div>
		</el-tooltip>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import moment from 'moment'
import {
	GET_GLOBAL_SURGE_FORECAST_TS,
	GET_SHADE_NAV_TIME,
	SET_GLOBAL_SURGE_FORECAST_TS,
} from '@/store/types'
/** + 24-10-30 预报时间选择组件 */
@Component({})
export default class SubNavForecastTimeItem extends Vue {
	/** 当前的时间步长(单位:小时) */
	@Prop({ type: Number, default: 1 })
	step: number

	// @Prop({ type: Boolean, default: true })
	/** 是否遮罩 t:遮罩|f:不遮罩 */
	isShade = false

	/** 当前选定的预报时间索引(index) */
	selectIndex = 0

	// forecastDtList: number[] = [
	// 	new Date(2024, 10, 28, 8).valueOf(),
	// 	new Date(2024, 10, 28, 16).valueOf(),
	// 	new Date(2024, 10, 29, 8).valueOf(),
	// 	new Date(2024, 10, 29, 16).valueOf(),
	// 	new Date(2024, 10, 30, 8).valueOf(),
	// ]
	/** 由父组件传入的预报时间集合 */
	@Prop({ type: Array, default: [] })
	forecastTsList: number[]

	convertDt2Str(formatStr: string): string {
		const dt: Date = this.currentDt
		const dtMoment: moment.Moment = moment(dt)
		let convertStr = ''
		convertStr = `${dtMoment.format('yyyy-MM-DD HH')} 时`
		return convertStr
	}

	/** 24-10-30 当前选中的时间 */
	get currentDt(): Date {
		return new Date(this.forecastTsList[this.selectIndex])
	}

	/** TODO:[*] 24-10-31
	 *  24-10-30 当前选中的时间戳(ms) */
	get currentTs(): number {
		return this.forecastTsList[this.selectIndex]
	}

	/** 对当前 currentDt 进行操作 */
	addDt(): void {
		/** 当前时间index */
		let currentIndex = this.selectIndex + 1
		currentIndex =
			currentIndex < this.forecastTsList.length
				? currentIndex
				: this.forecastTsList.length - 1
		this.selectIndex = currentIndex
	}

	subDt(): void {
		/** 当前时间index */
		let currentIndex = this.selectIndex - 1
		currentIndex = currentIndex >= 0 ? currentIndex : 0
		this.selectIndex = currentIndex
	}

	/** 为父组件的 forecastDt 赋值 */
	setFatherForecastTs(val: Date): void {
		this.$emit('updateForecastTs', val)
	}

	@Watch('currentTs')
	onCurrentTs(val: number): void {
		// this.setFatherForecastTs(val)
		this.setForecastTs(val)
	}

	/** 设置预报时间戳 */
	@Mutation(SET_GLOBAL_SURGE_FORECAST_TS, { namespace: 'surge' })
	setForecastTs: (val: number) => void

	/** 是否遮罩 timebar */
	@Getter(GET_SHADE_NAV_TIME, { namespace: 'common' }) getIsShadeTimeBar: boolean

	@Watch('getIsShadeTimeBar')
	onGetIsShadeTimebar(val: boolean): void {
		this.isShade = val
	}
}
</script>
<style scoped lang="less">
@import '../../../styles/btn.less';
@import '../../../styles/base-form.less';
.nav_item_timebar {
	display: flex;
	align-items: center;
	background: #233446;
	// padding: 5px;
	margin: 5px;
	border-radius: 8px;
	box-shadow: 0 0 5px 0px black;
	.timebar_child {
		display: flex;
		margin-left: 5px;
		margin-right: 5px;
		font-weight: 500;
		height: 100%;
		align-items: center;
		width: 100%;
		div {
			height: 100%;
		}
		.nav_icon_operator {
			width: 20px;
			justify-content: center;
		}
		.nav_icon_operator:hover {
			// background: #16a085;
		}

		div:nth-child(2) {
			// width: 60px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}
.is-shade {
	@div-filter();
}
</style>
