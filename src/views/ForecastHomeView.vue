<template>
	<div class="home">
		<div class="layout-top">
			<div class="layout-right"><ForecastMapView></ForecastMapView></div>
		</div>
		<!-- 温带预报系统底部的主要操作按钮栏 -->
		<div class="layout-bottom"><WdSubNavMenuView></WdSubNavMenuView></div>
		<!-- <WaveGridForecastDataFormView></WaveGridForecastDataFormView> -->
		<StationInlandSurgeDataFormView
			:startTs="issueTs"
			:endTs="endTs"
			:issueTs="issueTs"
		></StationInlandSurgeDataFormView>
		<!-- <div><StationTideFormView></StationTideFormView></div> -->
		<StationLayoutView :startTs="issueTs" :endTs="endTs" :issueTs="issueTs"></StationLayoutView>
		<!-- <StationExtremumListView :tyNum="tyNum"></StationExtremumListView> -->
		<ThumbListView></ThumbListView>
		<HeaderLogoView title="温带风暴潮预报系统"></HeaderLogoView>
		<WdLegendListView></WdLegendListView>
		<!-- <RegionStatisticsCard></RegionStatisticsCard> -->
	</div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import MainNavMenuView from '@/components/nav/MainNavMenuView.vue'
import WdSubNavMenuView from '@/components/nav/WdSubNavMenuView.vue'
// import MainMapView from '@/views/map/MapView.vue'
import ForecastMapView from '@/views/map/ForecastMapView.vue'
import ThumbListView from '@/components/thumbs/thumbListView.vue'
import HeaderLogoView from '@/components/header/headerLogoView.vue'
import WdLegendListView from '@/components/toolsBar/wdLegendListView.vue'
import WaveGridForecastDataFormView from '@/components/forms/WaveGridForecastDataForm.vue'
import StationInlandSurgeDataFormView from '@/components/forms/StationInlandSurgeDataFormView.vue'
import StationLayoutView from '@/components/table/stationLayoutView.vue'
import StationSurgeDataFormView from '@/components/forms/StationSurgeDataFormView.vue'
import RegionStatisticsCard from '@/components/cards/regionStatisticsCard.vue'

// 默认值
import { DEFAULT_DATE, DEFAULT_TIMESTAMP, DEFAULT_TY_NUM } from '@/const/default'
// vuex
import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_ISSUE_TS,
	GET_TIMESPAN,
} from '@/store/types'
import { LayerTypeEnum } from '@/enum/map'
// interface
import { IHttpResponse } from '@/interface/common'
// api
import { loadRecentWaveProductIssus } from '@/api/wave'
import moment from 'moment'
import { MS_UNIT } from '@/const/unit'

@Component({
	components: {
		MainNavMenuView,
		WdSubNavMenuView,
		// MainMapView,
		ForecastMapView,
		ThumbListView,
		HeaderLogoView,
		WdLegendListView,
		WaveGridForecastDataFormView,
		// StationSurgeDataFormView,
		StationInlandSurgeDataFormView,
		RegionStatisticsCard,
		StationLayoutView,
	},
})
export default class HomeView extends Vue {
	// issueTs = 1690804800

	mounted() {}
	/** vuex 设置当前海浪产品的发布时间 */
	@Mutation(SET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' }) setWaveProductIssueDatetime

	@Mutation(SET_WAVE_PRODUCT_ISSUE_TIMESTAMP, { namespace: 'wave' }) setWaveProductIssueTimestamp

	/** 当前选中的海浪预报产品 */
	@Getter(GET_WAVE_PRODUCT_LAYER_TYPE, { namespace: 'wave' })
	getWaveProductLayerType: LayerTypeEnum

	/** 当前的发布时间 单位 s */
	@Getter(GET_ISSUE_TS, { namespace: 'common' })
	issueTs: number

	/** 起止时间间隔 单位s  */
	@Getter(GET_TIMESPAN, { namespace: 'common' })
	timespan: number

	/** 结束时间戳 (issueTs+ timespan) 单位 s */
	get endTs(): number {
		return this.issueTs + this.timespan
	}

	@Watch('getWaveProductLayerType')
	onWaveProductLayerType(val: LayerTypeEnum): void {
		let issueDatetime = DEFAULT_DATE
		let issueTimestamp = DEFAULT_TIMESTAMP
		if (val !== LayerTypeEnum.UN_LAYER) {
			loadRecentWaveProductIssus(val)
				.then(
					(
						res: IHttpResponse<{
							gmt_forecast_issue: string
							gmt_forecast_issue_timestamp: number
						}>
					) => {
						if (res.status === 200) {
							try {
								issueDatetime = moment(res.data.gmt_forecast_issue).toDate()
								issueTimestamp = res.data.gmt_forecast_issue_timestamp
							} catch (error) {
								issueDatetime = DEFAULT_DATE
								issueTimestamp = DEFAULT_TIMESTAMP
							} finally {
								// console.log(issueDatetime)
							}
						}
					}
				)
				.catch(() => {
					issueDatetime = DEFAULT_DATE
				})
				.finally(() => {
					this.setWaveProductIssueDatetime(issueDatetime)
					this.setWaveProductIssueTimestamp(issueTimestamp)
				})
		}
	}
}
</script>

<style scoped lang="less">
@import '../styles/base';
.home {
	@center();
	flex-direction: column;
	.layout-top {
		height: 100%;
		// background: green;
		display: flex;
		flex-direction: row;
		.layout-left {
			margin: 5px;
			background: #34495e;
			border-radius: 8px;
			box-shadow: 0 0 10px 0px black;
		}
		.layout-right {
			margin-top: 5px;
			width: 100%;
			background: #34495e;
			border-radius: 8px;
			margin-right: 5px;
			margin-bottom: 5px;
			box-shadow: 0 0 10px 0px black;
			// 防止地图溢出
			overflow: hidden;
		}
	}
	.layout-bottom {
		height: 50px;
		// TODO:[-] 22-10-17 win 系统中的浏览器会出现垂直和水平的滚动条
		// width: 100%;
		background: #34495e;
		border-radius: 8px;
		margin: 5px;
		box-shadow: 0 0 10px 0px black;
		display: flex;
		align-content: center;
		justify-content: center;
	}
}
</style>
