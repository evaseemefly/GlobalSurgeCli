<template>
	<div class="nav_item_timebar" id="surge_offset_time" :class="isShade ? 'is-shade' : ''">
		<div class="timebar_child">
			<div class="nav_item_icon nav_icon_operator" @click="subStep()">-</div>
			<div>{{ offset }}</div>
			<div class="nav_item_icon nav_icon_operator" @click="addStep()">+</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/** + 23-08-30 时间偏移 */
@Component({})
export default class SubNavOffsetTimeItem extends Vue {
	/** 起止时间间隔(单位:s) */
	@Prop({ type: Number, default: 0 })
	offset: number

	/** 当前的时间步长(单位:s) */
	@Prop({ type: Number, default: 1 })
	timeStep: number

	// @Prop({ type: Boolean, default: true })
	/** 是否遮罩 t:遮罩|f:不遮罩 */
	isShade = false

	currentDt: Date = new Date()

	/** 对 offset + timeStep */
	addStep(): void {
		this.setFatherOffset(this.offset + this.timeStep)
	}

	/** 对 offset - timeStep */
	subStep(): void {
		this.setFatherOffset(this.offset - this.timeStep)
	}

	/** 调用父级 更新offset */
	setFatherOffset(val: number): void {
		this.$emit('updateOffset', val)
	}
}
</script>
<style scoped lang="less">
@import '../../../styles/btn.less';
@import '../../../styles/base-form.less';
#surge_offset_time {
	height: 30px;
	width: 90px;
	color: white;
}
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
