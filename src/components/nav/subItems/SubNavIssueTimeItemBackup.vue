<template>
	<div class="nav_item_timebar">
		<el-tooltip class="item" effect="dark" content="产品发布时间" placement="top">
			<div class="timebar_child">
				<!-- <div class="nav_item_icon nav_icon_operator">-</div> -->
				<div class="nav_item_icon nav_icon_operator">
					{{ issueDatetime | fortmatData2YMDHM }}
				</div>
				<!-- <div class="nav_item_icon nav_icon_operator">+</div> -->
			</div>
		</el-tooltip>
	</div>
</template>
<script lang="ts">
import { DEFAULT_DATE } from '@/const/default'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// 过滤器
import { fortmatData2YMDHM } from '@/util/filter'
import { Getter } from 'vuex-class'
import { GET_WAVE_PRODUCT_ISSUE_DATETIME } from '@/store/types'
/** 发布时间组件 */
@Component({
	filters: {
		fortmatData2YMDHM,
	},
})
export default class SubNavIssueTimeItem extends Vue {
	/** 发布时间 */
	issueDatetime: Date = DEFAULT_DATE

	/** 获取当前产品的发布时间 */
	@Getter(GET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' })
	getWaveProductIssueDt: Date

	@Watch('getWaveProductIssueDt')
	onGetWaveProductIssueDt(val: Date): void {
		this.issueDatetime = val
	}
}
</script>
<style scoped lang="less">
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
			// width: 10px;
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
</style>
