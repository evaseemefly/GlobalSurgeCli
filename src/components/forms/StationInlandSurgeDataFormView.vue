<template>
	<!-- <transition
		enter-active-class="animate__animated animate__fadeIn"
		leave-active-class="animate__animated animate__fadeOut"
	> -->
	<div v-draggable id="station_surge_form" v-if="getIsShow" class="right-station-surge-form">
		<div class="my-detail-form">
			<div class="sub-titles">
				<div
					:class="[
						index == subTitleIndex ? 'actived my-sub-title' : 'unactived my-sub-title',
						item.disabled ? 'disabled' : '',
					]"
					:key="index"
					@click="checkSubTitle(index)"
					v-for="(item, index) in subTitles"
				>
					{{ item.title }}
				</div>
				<!-- <div class="my-sub-title right" @click="setExpanded()">最小化</div> -->
			</div>
			<div class="detail-content">
				<StationInlandSurgeChartView
					:startTs="issueTs"
					:endTs="endTs"
					:issueTs="issueTs"
				></StationInlandSurgeChartView>
			</div>
		</div>
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import StationInlandSurgeChartView from '@/components/charts/StationInlandSurgeDataCharts.vue'
import { GET_SHOW_STATION_SURGE_FORM } from '@/store/types'
@Component({ components: { StationInlandSurgeChartView } })
export default class StationInlandSurgeDataFormView extends Vue {
	@Prop({ type: Number })
	startTs: number

	@Prop({ type: Number })
	endTs: number

	@Prop({ type: Number })
	issueTs: number

	@Getter(GET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) getIsShow: boolean
}
</script>
<style scoped lang="less">
@import '../../styles/station/station-chart';
// + 21-12-06 加入重写的 emelemtnui 样式
@import '../../styles/my-elementui/common';
@import '../../styles/base-form.less';
.test {
	background: rgb(252, 182, 31);
	color: rgb(235, 232, 70);
}

#station_surge_form {
	bottom: 60px;
	left: 50px;
	// @form-base-background();
}
.detail-content {
	@form-base-background();
}
</style>
