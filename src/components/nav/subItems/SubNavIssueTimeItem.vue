<template>
	<div class="nav_item_timebar">
		<el-tooltip class="item" effect="dark" content="产品发布时间" placement="top">
			<div class="timebar_child">
				<!-- <div class="nav_item_icon nav_icon_operator">-</div> -->
				<div id="issue_selecter_nav" class="nav_item_icon nav_icon_operator">
					<el-select
						v-model="issueTS"
						placeholder="请选择"
						:popper-append-to-body="false"
					>
						<el-option
							v-for="item in issueTimeList"
							:key="item.ts"
							:label="fortmatData2MDHM(item.ts * MS)"
							:value="item.ts"
						>
						</el-option>
					</el-select>
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
import { Getter, Mutation } from 'vuex-class'
import { GET_WAVE_PRODUCT_ISSUE_DATETIME, SET_ISSUE_TS, SET_TIMESPAN } from '@/store/types'
import { loadDistCoverageIssueTs } from '@/api/raster'
import { IHttpResponse } from '@/interface/common'
import { fortmatData2MDHM } from '@/util/filter'
import moment from 'moment'
/** 发布时间组件 */
@Component({
	filters: {
		fortmatData2YMDHM,
	},
})
export default class SubNavIssueTimeItem extends Vue {
	/** 发布时间 */
	issueDatetime: Date = DEFAULT_DATE
	/** 发布时间戳 */
	issueTS = 0

	/** 1s=1000ms */
	MS = 1000

	issueTimeList: { ts: number; dt: Date }[] = []

	mounted() {
		loadDistCoverageIssueTs()
			.then((res: IHttpResponse<number[]>) => {
				let issueTimeList: { ts: number; dt: Date }[] = []
				if (res.status == 200) {
					res.data.forEach((element) => {
						issueTimeList.push({ ts: element, dt: moment(element * this.MS).toDate() })
					})
				}
				return issueTimeList
			})
			.then((issueList: { ts: number; dt: Date }[]) => {
				this.issueTS = issueList[0].ts
				this.issueTimeList = issueList
			})
	}

	fortmatData2MDHM(ts: number) {
		return fortmatData2MDHM(ts)
	}

	optionVal = ''

	/** 获取当前产品的发布时间 */
	@Getter(GET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' })
	getWaveProductIssueDt: Date

	/** 设置当前的发布时间 */
	@Mutation(SET_ISSUE_TS, { namespace: 'common' })
	setIssueTimeSpan: (val: number) => void

	@Watch('getWaveProductIssueDt')
	onGetWaveProductIssueDt(val: Date): void {
		this.issueDatetime = val
	}

	@Watch('issueTS')
	onIssueTs(val: number): void {
		this.setIssueTimeSpan(val)
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
// TODO:[*] 23-08-04 此处覆盖 element ui input 原样式有问题
.nav_item_timebar {
	.nav_icon_operator {
		.el-inupt_inner {
			background: #34495e;
			/* color: green; */
			overflow: hidden;
			border-radius: 2px;
			color: white;
		}
	}
}
#issue_selecter_nav {
	width: 140px;
	.el-select {
		.el-input {
			.el-inupt_inner {
				background: #34495e;
				/* color: green; */
				overflow: hidden;
				border-radius: 2px;
				color: white;
			}
		}
	}
}
.el-inupt_inner {
}
</style>
