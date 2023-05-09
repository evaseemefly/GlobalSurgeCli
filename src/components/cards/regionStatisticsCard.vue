<template>
	<div id="region_statistics_card" v-draggable>
		<!-- 总的信息栏——顶部 -->
		<div class="detail-info">
			<div class="left">
				<class class="content">{{ countryCount }}</class>
			</div>
			<div class="right">
				<div class="main-title">国家及地区</div>
				<div class="sub-title" @click="isShowStatisticForm = !isShowStatisticForm">
					国家及一些地区
				</div>
			</div>
		</div>
		<!-- <transition
			enter-active-class="animate__animated animate__fadeIn"
			leave-active-class="animate__animated animate__fadeOut"
		> -->
		<div class="form-right-content" v-show="isShowStatisticForm">
			<!-- 默认隐藏的国家列表 -->
			<div class="country-list">
				<table>
					<thead>
						<tr>
							<th>国家及地区</th>
							<!-- <th>en</th> -->
							<!-- <th>时间</th> -->
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(countryTemp, index) in countryStatisticsList"
							:key="countryTemp.id"
							@click="setCurrentCountry(countryTemp)"
							:class="index == selectedTrIndex ? 'activate' : ' '"
						>
							<td>{{ countryTemp.valCh }}</td>
							<!-- <td class="null-color"> -->
							<!-- {{ countryTemp.valEn }} -->
							<!-- <TideValuePrgressLineView
							:realdata="stationTemp.realdata"
							:lineWidth="84"
							:alertTides="stationTemp.alerts"
						></TideValuePrgressLineView> -->
							<!-- </td> -->
							<!-- <td>{{ stationTemp.dt | fortmatData2MDHM }}</td> -->
						</tr>
					</tbody>
				</table>
			</div>
			<div class="station-status-list">
				<div class="body-content">
					<table>
						<thead>
							<tr>
								<th style="width: 80px">编号</th>
								<!-- <th>en</th> -->
								<th style="width: 120px">最后更新时间</th>
								<th style="width: 80px">状态</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="(stationTemp, index) in stationStatusList"
								:key="stationTemp.id"
								@click="setStationCode(stationTemp.stationCode)"
								:class="index == selectedTrIndex ? 'activate' : ' '"
							>
								<td>{{ stationTemp.stationCode }}</td>
								<td>{{ stationTemp.gmtDt | fortmatData2MDHM }}</td>
								<td class="td-status">
									<div
										:class="getStationStatusCls(stationTemp.gmtDt)"
										class="status-bar"
									></div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="station-status-station-count-footer">
					<div class="content">{{ stationStatusList.length }}</div>
					<div class="foot-titles">
						<div class="main-title">
							<span>{{ currentCountry | formatContry2Str }}</span>
						</div>
						<div class="sub-title">当前国家</div>
					</div>
				</div>
			</div>
		</div>
		<!-- </transition> -->
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import { IHttpResponse } from '@/interface/common'
import { loadAllCountryCount, loadRegionListByPid } from '@/api/region'
import { loadStationStatusByPid } from '@/api/station'
import { fortmatData2MDHM, filterSpiderStationStatusCls, formatContry2Str } from '@/util/filter'
import { SET_REGION_PID, SET_STATION_CODE, GET_NOW } from '@/store/types'
@Component({
	filters: {
		fortmatData2MDHM,
		filterSpiderStationStatusCls,
		formatContry2Str,
	},
})
export default class RegionStatisticsCard extends Vue {
	/** 国家统计集合 */
	countryStatisticsList: { id: number; valCh: string; valEn: string; count: number }[] = []

	/** 海洋站状态集合 */
	stationStatusList: {
		id: number
		valCh: string
		valEn: string
		stationCode: string
		gmtDt: Date
		pid: number
	}[] = []

	currentCountry: { id: number; valCh: string; valEn: string; count: number } = null

	selectedTrIndex = -1
	@Getter(GET_NOW, { namespace: 'common' })
	now: Date

	countryCount = 0

	/** 是否展开统计详情栏 */
	isShowStatisticForm = false

	mounted() {
		this.getAllCountryCount()
		this.loadRegionList()
	}

	getAllCountryCount(): void {
		loadAllCountryCount().then((res: IHttpResponse<{ count: number }>) => {
			if (res.status == 200) {
				this.countryCount = res.data.count
			}
		})
	}

	loadRegionList(): void {
		const that = this
		this.countryStatisticsList = []
		loadRegionListByPid().then(
			(res: IHttpResponse<{ id: number; val_en: string; val_ch: string; pid: number }[]>) => {
				if (res.status === 200) {
					res.data.forEach((item) => {
						that.countryStatisticsList.push({
							id: item.id,
							valCh: item.val_ch,
							valEn: item.val_en,
							count: 0,
						})
					})
				}
			}
		)
	}

	loadStationStatusByPid(pid: number): void {
		const that = this
		this.stationStatusList = []
		loadStationStatusByPid(pid).then(
			(
				res: IHttpResponse<
					{
						id: number
						val_ch: string
						val_en: string
						station_code: string
						gmt_realtime: Date
						pid: number
					}[]
				>
			) => {
				if (res.status === 200) {
					res.data.forEach((item) => {
						that.stationStatusList.push({
							id: item.id,
							valCh: item.val_ch,
							valEn: item.val_en,
							stationCode: item.station_code,
							gmtDt: new Date(item.gmt_realtime),
							pid: item.pid,
						})
					})
				}
			}
		)
	}

	setCurrentCountry(val: { id: number; valCh: string; valEn: string; count: number }): void {
		console.log(val.id)
		this.currentCountry = val
		this.setPid(val.id)
		this.loadStationStatusByPid(val.id)
	}

	getStationStatusCls(updatedDt: Date): string {
		return filterSpiderStationStatusCls(updatedDt, this.now)
	}

	@Mutation(SET_REGION_PID, { namespace: 'station' }) setPid

	@Mutation(SET_STATION_CODE, { namespace: 'station' }) setStationCode
}
</script>
<style scoped lang="less">
@import url('../../styles/base-form.less');
.status-bar {
	height: 20px;
	width: 70px;
	border-radius: 5px;
}
#region_statistics_card {
	position: absolute;
	top: 80px;
	right: 100px;
	margin: 5px;
	// 统一的 shadow 效果
	@form-base-shadow();
	// 统一的边角半圆过渡
	@form-base-radius();
	@form-base-background();
	// width: 300px;
	z-index: 999;
	max-height: 600px;
	overflow: hidden;
	.detail-info {
		display: flex;
		// margin: 5px;
		align-items: flex-start;
		display: flex;
		flex-direction: row;
		padding: 10px;
		background: #2c3a4878;
		overflow: hidden;

		.left {
			order: 1;
			flex-grow: 3;
			display: flex;
			align-self: center;
			align-items: center;
			justify-content: center;
			min-width: 100px;
			.content {
				font-size: 2.2rem;
				font-weight: bolder;
				// margin: 10px;
				// color: white;
				color: rgb(45, 241, 255);
			}
		}
		.right {
			order: 2;
			flex-grow: 1;
			.main-title {
				color: white;
				font-size: 1.2rem;
				display: flex;
				// margin: 10px;
			}
			.sub-title {
				display: flex;
				// align-items: center;
				font-size: 1rem;
				color: rgb(171, 178, 179);
				display: flex;
			}
		}
	}
	.form-right-content {
		display: flex;
		.country-list {
			color: white;
			margin: 5px;
			padding: 10px;
			width: 160px;
			max-height: 300px;
			overflow: scroll;
			overflow-x: hidden;
			table {
				// table自动按照父div的宽度填充满
				table-layout: auto;
				width: 100%;
				tbody {
					tr {
						line-height: 150%;
						td.td-status {
							display: flex;
							flex-wrap: nowrap;
							justify-content: center;
						}
					}
					.td-status {
					}
				}
			}
		}
		.station-status-list {
			color: white;
			// margin: 5px;
			// padding: 10px;
			// max-height: 300px;
			// overflow: scroll;
			overflow-x: hidden;
			position: relative;
			.body-content {
				height: 250px;
				max-height: 300px;
				overflow: scroll;
				overflow-x: hidden;
				table {
					tbody {
						tr {
							line-height: 150%;
						}
					}
				}
			}

			.station-status-station-count-footer {
				height: 50px;
				display: flex;
				position: absolute;
				bottom: 0px;
				width: 100%;
				display: flex;
				justify-content: space-evenly;
				background: #2c3a4878;
				padding: 5px;
				.content {
					color: aquamarine;
					font-size: 2.2rem;
					font-weight: bolder;
				}
				.foot-titles {
					.main-title {
					}
					.sub-title {
						font-size: 1rem;
						color: rgb(171, 178, 179);
					}
				}
			}
			// table {
			// 	thead {
			// 		tr {
			// 			th {
			// 				width: 60px;
			// 			}
			// 		}
			// 	}
			// 	.th {
			// 	}
			// }
		}
	}
}
</style>
