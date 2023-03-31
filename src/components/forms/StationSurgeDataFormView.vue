<template>
	<div v-draggable id="station_surge_form" class="right-station-surge-form" v-show="getIsShow">
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
				<div class="my-sub-title right" @click="setExpanded()">最小化</div>
			</div>
			<div class="detail-content">
				<StationSurgeChartView></StationSurgeChartView>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import StationSurgeChartView from '@/components/charts/StationSurgeDataCharts.vue'
@Component({ components: { StationSurgeChartView } })
export default class StationSurgeDataFormView extends Vue {
	mydata: any = null
	mounted() {}
	get computedTest() {
		return null
	}
	getIsShow = true
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

#wave_form {
	min-height: 495px;
	min-width: 556px;
	// height: 100%;
	height: 500px;
	position: absolute;
	z-index: 9999;
	top: 50px;
	left: 180px;
	// @form-base-background();
}
.detail-content {
	@form-base-background();
}
</style>
