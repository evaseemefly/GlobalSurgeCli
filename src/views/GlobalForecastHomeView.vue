<template>
	<div class="home">
		<div class="layout-top">
			<!-- <div class="layout-left"><MainNavMenuView></MainNavMenuView></div> -->
			<div class="layout-right"><GlobalForecastMapView></GlobalForecastMapView></div>
		</div>
		<div class="layout-bottom">
			<SubNavGlobalForecastMenuView></SubNavGlobalForecastMenuView>
		</div>
		<!-- <WaveGridForecastDataFormView></WaveGridForecastDataFormView> -->
		<StationGlobalSurgeDataFormView></StationGlobalSurgeDataFormView>
		<!-- <div><StationTideFormView></StationTideFormView></div> -->
		<!-- <StationLayoutView :tyNum="tyNum"></StationLayoutView> -->
		<!-- <StationExtremumListView :tyNum="tyNum"></StationExtremumListView> -->
		<!-- <ThumbListView></ThumbListView> -->
		<HeaderLogoView title="全球风暴潮监测预报系统"></HeaderLogoView>
		<LegendListView></LegendListView>
		<RegionStatisticsCard></RegionStatisticsCard>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import MainNavMenuView from '@/components/nav/MainNavMenuView.vue'
import SubNavGlobalForecastMenuView from '@/components/nav/SubNavGlobalForecastMenuView.vue'
import GlobalForecastMapView from '@/views/map/GlobalForecastMap.vue'
import ThumbListView from '@/components/thumbs/thumbListView.vue'
import HeaderLogoView from '@/components/header/headerLogoView.vue'
import LegendListView from '@/components/toolsBar/legendListView.vue'
import WaveGridForecastDataFormView from '@/components/forms/WaveGridForecastDataForm.vue'
import StationGlobalSurgeDataFormView from '@/components/forms/StationGlobalSurgeDataFormView.vue'
import RegionStatisticsCard from '@/components/cards/regionStatisticsCard.vue'

// 默认值
import { DEFAULT_DATE, DEFAULT_TIMESTAMP, DEFAULT_TY_NUM } from '@/const/default'
// vuex
import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_SURGE_FORECAST_AREA,
} from '@/store/types'
import { ForecastAreaEnum, LayerTypeEnum } from '@/enum/map'
// interface
import { IHttpResponse } from '@/interface/common'
// api
import { loadRecentWaveProductIssus } from '@/api/wave'
import moment from 'moment'

@Component({
	components: {
		MainNavMenuView,
		SubNavGlobalForecastMenuView,
		GlobalForecastMapView,
		ThumbListView,
		HeaderLogoView,
		LegendListView,
		WaveGridForecastDataFormView,
		StationGlobalSurgeDataFormView,
		RegionStatisticsCard,
	},
})
export default class GlobalForecastHomeView extends Vue {
	mounted() {
		/**
		 * 24-10-29
		 * 数据获取主要在 home 组件内完成
		 */
	}
	/** vuex 设置当前海浪产品的发布时间 */
	@Mutation(SET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' }) setWaveProductIssueDatetime

	@Mutation(SET_WAVE_PRODUCT_ISSUE_TIMESTAMP, { namespace: 'wave' }) setWaveProductIssueTimestamp

	/** 当前选中的海浪预报产品 */
	@Getter(GET_WAVE_PRODUCT_LAYER_TYPE, { namespace: 'wave' })
	getWaveProductLayerType: LayerTypeEnum

	/** 获取全球潮位预报区域 */
	@Getter(GET_SURGE_FORECAST_AREA, { namespace: 'surge' })
	getSurgeForecastArea: ForecastAreaEnum

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
