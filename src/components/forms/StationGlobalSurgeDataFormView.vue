<template>
	<!-- <transition
		enter-active-class="animate__animated animate__fadeIn"
		leave-active-class="animate__animated animate__fadeOut"
	> -->
	<div v-draggable id="station_surge_form" v-if="getIsShow" class="right-station-surge-form">
		<div class="my-detail-form">
			<div class="detail-content">
				<StationGlobalSurgeChartView></StationGlobalSurgeChartView>
			</div>
		</div>
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import StationGlobalSurgeChartView from '@/components/charts/StationGlobalSurgeDataCharts.vue'
import { GET_SHOW_STATION_SURGE_FORM } from '@/store/types'
@Component({ components: { StationGlobalSurgeChartView } })
export default class StationGlobalSurgeDataFormView extends Vue {
	mydata: any = null
	mounted() {}
	get computedTest() {
		return null
	}
	// getIsShow = true

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
