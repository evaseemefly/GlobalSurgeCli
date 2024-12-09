<template>
	<div>
		<el-tooltip class="item" effect="dark" content="预报产品" placement="top">
			<nav class="nav_item nav_item_icons">
				<div
					:class="[isSurgeMax ? 'activate' : 'un_activate', , 'nav_item_icon']"
					@click="isSurgeMax = !isSurgeMax"
				>
					<i class="fa-solid fa-tornado"></i>
				</div>
				<div class="hidden_box_switch" v-show="isSurgeMax">
					<el-switch v-model="isSurgeMax" active-text="栅格" inactive-text="等值线">
					</el-switch>
				</div>
			</nav>
		</el-tooltip>
	</div>
</template>
<script lang="ts">
import { ForecastProductTypeEnum } from '@/enum/surge'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
@Component({})
export default class SubNavProductTypeSwitch extends Vue {
	productType: ForecastProductTypeEnum = ForecastProductTypeEnum.SURGE_MAX
	/** 是否为最大增水场 */
	isSurgeMax = true
	@Watch('isSurgeMax')
	onIsSurgeMax(val: boolean) {
		this.productType = val
			? ForecastProductTypeEnum.SURGE_MAX
			: ForecastProductTypeEnum.SURGE_HOURLY
	}
	mounted() {}
}
</script>
<style scoped lang="less">
.nav_item_icons {
	background: #233446;
	padding: 5px;
	margin: 5px;
	border-radius: 8px;
	display: flex;
	display: flex;
	justify-content: center;
	align-items: center;
	min-width: 36px;
	overflow: hidden;
	svg {
		margin-left: 5px;
		margin-right: 5px;
	}
}
</style>
