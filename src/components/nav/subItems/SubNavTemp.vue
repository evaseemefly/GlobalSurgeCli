<template>
	<div class="nav_item_timebar">
		<div class="timebar_child">
			<div>{{ tempTitle }}:{{ tempVal }}</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import moment from 'moment'
import { GET_SHADE_NAV_TIME } from '@/store/types'
import { formatSecond2Hour } from '@/util/filter'
/** 显示 val 的sub nav */
@Component({ filters: { formatSecond2Hour } })
export default class SubNavTemp extends Vue {
	/** 起止时间间隔(单位:s) */
	@Prop({ type: String, default: '-' })
	tempVal: string

	@Prop({ type: String, default: '-' })
	tempTitle: string
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
		margin-left: 8px;
		margin-right: 8px;
		font-weight: 500;
		// height: 100%;
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
