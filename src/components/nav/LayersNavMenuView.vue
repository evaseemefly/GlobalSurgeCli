<template>
	<nav id="layers_nav_men">
		<!-- <font-awesome-icon :icon="menuItem.icons" v-for="menuItem in menuList" :key="menuItem.id" /> -->
		<el-tooltip
			class="item"
			effect="dark"
			:content="menuItem.desc"
			placement="right"
			:key="menuItem.id"
			v-for="menuItem in menuList"
		>
			<div
				class="nav_menu-item"
				@click="selectedNavMenu = menuItem.menuType"
				:class="selectedNavMenu == menuItem.menuType ? 'activate' : 'un_activate'"
			>
				<i class="fa fa-1x" :class="menuItem.icon"></i>
			</div>
		</el-tooltip>
		<!-- <div ></div> -->
	</nav>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { LayerTypeEnum } from '@/enum/map'
import { Layer } from 'leaflet'
import { Mutation } from 'vuex-class'
import { SET_WAVE_PRODUCT_LAYER_TYPE } from '@/store/types'
/** 图层切换菜单栏 */
@Component({})
export default class LayersNavMenuView extends Vue {
	/** 当前选中的 layertype */
	selectedNavMenu = LayerTypeEnum.UN_LAYER
	menuList: {
		title: string
		desc: string
		icon: string
		icons: string[]
		menuType: LayerTypeEnum
	}[] = [
		{
			title: '72小时最大增水场',
			desc: '72小时最大增水场',
			icon: `fa-solid fa-water`,
			icons: ['fa-solid', 'fa-water'],
			menuType: LayerTypeEnum.RASTER_LAYER_WVE,
		},
		// {
		// 	title: '平均周期',
		// 	desc: '平均周期',
		// 	icon: `fa-solid fa-hourglass-end`,
		// 	icons: ['fa-solid', 'fa-magnifying-glass-location'],
		// 	menuType: LayerTypeEnum.RASTER_LAYER_MWP,
		// },
		// {
		// 	title: '平均波向',
		// 	desc: '平均波向',
		// 	icon: `fa-solid fa-location-arrow`,
		// 	icons: ['fa-solid', 'fa-location-arrow'],
		// 	menuType: LayerTypeEnum.RASTER_LAYER_MWD,
		// },
		{
			title: '海洋站',
			desc: '海洋站',
			icon: `fa-solid fa-cloud-showers-water`,
			icons: ['fa-solid', 'fa-cloud-showers-water'],
			menuType: LayerTypeEnum.ICON_STATION,
		},
	]

	@Watch('selectedNavMenu')
	onSelectedNavMenu(val: LayerTypeEnum): void {
		const desc: string = this.menuList.find((temp) => {
			return temp.menuType == val
		}).desc
		this.setWaveProductLayerType(val)
		this.$message({
			message: `选中${desc}栅格图层`,
			type: 'success',
		})
	}

	/** 设置海浪产品图层种类 */
	@Mutation(SET_WAVE_PRODUCT_LAYER_TYPE, { namespace: 'wave' })
	setWaveProductLayerType: (val: LayerTypeEnum) => void
}
</script>
<style scoped lang="less">
@import url('../../styles/base-form.less');
@import url('../../styles/btn.less');
#layers_nav_men {
	position: fixed;
	left: 50px;
	top: 50px;
	z-index: 999;
	// display: flex;
	flex-direction: column;
	align-items: center;
	// height: 100%;
	// background: #34495e;
	color: white;
	width: 50px;
	.nav_menu-item {
		@form-base-shadow();
		@form-base-background();
		// background: #2c3e50;
		// margin: 10px;
		height: 40px;
		width: 40px;
		border-radius: 8px;
		// box-shadow: inset 0 0 2px rgb(255 255 255 / 40%), inset 0 0 16px 12px #141a22;
		box-shadow: 0 0 5px 0px black;
		display: flex;
		justify-content: center;
		/* align-content: center; */
		align-items: center;
		margin-top: 5px;
		margin-bottom: 5px;
	}
}
</style>
