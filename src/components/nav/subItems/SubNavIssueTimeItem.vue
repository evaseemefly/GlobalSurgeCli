<template>
	<div class="nav_item_timebar">
		<el-tooltip class="item" effect="dark" content="产品发布时间" placement="top">
			<div class="timebar_child">
				<div id="issue_selecter_nav" class="nav_item_icon nav_icon_operator">
					<!-- TODO:[-] 24-11-06 使用时间选择器 -->
					<!-- <el-select
						v-model="issueTS"
						placeholder="请选择"
						:popper-append-to-body="false"
					>
						<el-option
							v-for="item in issueTsList"
							:key="item.ts"
							:label="fortmatData2MDHM(item.ts)"
							:value="item.ts"
						>
						</el-option>
					</el-select> -->
					<div class="nav_item_icon nav_icon_operator" @click="subDt()">-</div>
					<el-date-picker
						v-model="issueDatetime"
						:readonly="true"
						:value-format="'yyyy-MM-dd HH'"
						type="date"
						placeholder="选择日期"
						class="nav_item_dt_picker"
					>
					</el-date-picker>
					<div class="nav_item_icon nav_icon_operator" @click="addDt()">+</div>
				</div>
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
import {
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	SET_GLOBAL_SURGE_ISSUE_TS,
	SET_ISSUE_TS,
	SET_TIMESPAN,
} from '@/store/types'
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

	@Prop({ type: Array, default: [] })
	issueTsList

	// issueTimeList: { ts: number; dt: Date }[] = []

	mounted() {
		// loadDistCoverageIssueTs()
		// 	.then((res: IHttpResponse<number[]>) => {
		// 		let issueTimeList: { ts: number; dt: Date }[] = []
		// 		if (res.status == 200) {
		// 			res.data.forEach((element) => {
		// 				issueTimeList.push({ ts: element, dt: moment(element * this.MS).toDate() })
		// 			})
		// 		}
		// 		return issueTimeList
		// 	})
		// 	.then((issueList: { ts: number; dt: Date }[]) => {
		// 		this.issueTS = issueList[0].ts
		// 		this.issueTimeList = issueList
		// 	})
	}

	fortmatData2MDHM(ts: number) {
		return fortmatData2MDHM(ts)
	}

	optionVal = ''

	@Watch('issueTsList')
	onIssueTsList(val: number[]): void {
		this.issueTS = val[0]
		this.issueDatetime = new Date(this.issueTS)
	}

	/**
	 * TODO:[-] 25-03-25 注意 this.issueTsList 中的时间戳集合是降序排列的，所以若获取上一个时间戳，应该是当前时间戳的下一个
	 * 对当前 issueDatetime 时间 +1 位移
	 * */
	subDt() {
		let currentIndex = this.issueTsList.indexOf(this.issueTS) + 1
		currentIndex =
			currentIndex < this.issueTsList.length ? currentIndex : this.issueTsList.length - 1
		this.issueTS = this.issueTsList[currentIndex]
		this.issueDatetime = new Date(this.issueTS)
	}

	/** 对当前 issueDatetime 时间 -1 位移 */
	addDt() {
		let currentIndex = this.issueTsList.indexOf(this.issueTS) - 1
		currentIndex = currentIndex >= 0 ? currentIndex : 0
		this.issueTS = this.issueTsList[currentIndex]
		this.issueDatetime = new Date(this.issueTS)
	}

	/** 设置当前的发布时间 */
	@Mutation(SET_GLOBAL_SURGE_ISSUE_TS, { namespace: 'surge' })
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
	width: 190px;
	.nav_icon_operator {
		flex-grow: 1;
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		flex-direction: row;
		align-content: center;
		justify-content: center;
	}
	.nav_item_dt_picker {
		flex-grow: 4;
	}
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
