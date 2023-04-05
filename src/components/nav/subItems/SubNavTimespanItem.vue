<template>
	<div class="nav_item_timebar" :class="isShade ? 'is-shade' : ''">
		<div class="timebar_child">
			<div class="nav_item_icon nav_icon_operator" @click="subStep()">-</div>
			<div>{{ timeSpan | formatSecond2Hour }}</div>
			<div class="nav_item_icon nav_icon_operator" @click="addStep()">+</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import moment from 'moment'
import { GET_SHADE_NAV_TIME } from '@/store/types'
import { formatSecond2Hour } from '@/util/filter'
/** + 22-10-14 时间选择框 */
@Component({ filters: { formatSecond2Hour } })
export default class SubNavTimespanItem extends Vue {
	/** 起止时间间隔(单位:s) */
	@Prop({ type: Number, default: 1 })
	timeSpan: number

	/** 当前的时间步长(单位:s) */
	@Prop({ type: Number, default: 1 })
	timeStep: number

	// @Prop({ type: Boolean, default: true })
	/** 是否遮罩 t:遮罩|f:不遮罩 */
	isShade = false

	currentDt: Date = new Date()

	@Watch('forecastDt')
	onForecastDt(val: Date): void {
		this.currentDt = val
	}

	convertDt2Str(formatStr: string): string {
		const dt: Date = this.currentDt
		const dtMoment: moment.Moment = moment(dt)
		let convertStr = ''
		switch (formatStr) {
			case 'YYYY':
				convertStr = dtMoment.format('YYYY')
				break
			case 'MM':
				convertStr = dtMoment.format('MM') + '月'
				break
			case 'DD':
				convertStr = dtMoment.format('DD') + '日'
				break
			case 'HH':
				convertStr = dtMoment.format('HH') + '时'
				break
			default:
				convertStr = ''
				break
		}
		return convertStr
	}

	/** 对 timeSpan+timeStep */
	addStep(): void {
		this.setFatherTimespan(this.timeSpan + this.timeStep)
	}

	/** 对 timeSpan-timeStep */
	subStep(): void {
		this.setFatherTimespan(this.timeSpan - this.timeStep)
	}

	setFatherTimespan(val: number): void {
		this.$emit('updateTimespan', val)
	}

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
		div {
			height: 100%;
		}
		.nav_icon_operator {
			width: 10px;
		}
		.nav_icon_operator:hover {
			// background: #16a085;
		}

		div:nth-child(2) {
			width: 60px;
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
