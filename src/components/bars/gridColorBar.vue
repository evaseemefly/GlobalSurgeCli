<template>
	<div class="color-bar-list" v-show="isShow">
		<el-tooltip class="item" effect="dark" content="增水场等值面色标" placement="top-start">
			<transition name="color-bar-fade">
				<div class="color-bar" v-show="isShowScaleBar">
					<div class="color-bar-title font-align-center">
						<div class="font-align-center">单位:m</div>
					</div>
					<div class="color-bar-content">
						<div
							class="color-grid-item font-align-center"
							v-for="(colorTemp, index) in colorScalesList"
							:key="index"
							:style="{ background: colorTemp }"
						>
							<span>{{ colorScaleNumList[index] | formatSurgeFiex1NumStr }}</span>
						</div>
					</div>
				</div>
			</transition>
		</el-tooltip>
	</div>
</template>
<script lang="ts">
import { Prop, Vue, Watch } from 'vue-property-decorator'
import Component from 'vue-class-component'
import { Mutation, State, namespace, Getter } from 'vuex-class'
// 本项目
import { IColorScale, ColorScales, IScale } from '@/const/colorBar'
import { DEFAULT_DICT_KEY } from '@/const/default'
import { RasterLayerEnum } from '@/enum/map'
import { GET_RASTER_LAYER_KEY, GET_SCALAR_SHOW_TYPE } from '@/store/types'
import {
	GET_ISOSURGE_COLOR_SCALE_VAL_RANGE,
	GET_ISOSURGE_COLOR_SCALE_STR_LIST,
	GET_IS_SHOW_RASTER_LEGEND,
} from '@/store/types'
import { ScalarShowTypeEnum } from '@/enum/common'
import { formatSurgeFiex1NumStr } from '@/util/filter'
/** + 23-08-08 grid 色标组件 */
@Component({
	filters: { formatSurgeFiex1NumStr },
})
export default class GirdColorBar extends Vue {
	selectedScaleIndex = DEFAULT_DICT_KEY
	colorRange: number[] = []
	splitNum = 6 // 对当前 range 进行切分的数量
	colorScalesList: string[] = []

	colorScaleNumList: number[] = []
	toolTip = '对于大于1.0m的增水会色标进行原值*0.8'

	mounted(): void {
		this.setSelectedScale(0)
	}

	getBackgroundColorFirstStr(tempScale: { key: string; scale: IScale }): string {
		// eg: #ee4620,#ee462f,#ed4633,#ef6b6d,#f3a4a5,#f9dcdd,#dcdcfe,
		let colorStr = ''
		if (tempScale.scale !== undefined && tempScale.scale.scaleColorList !== undefined) {
			if (Array.isArray(tempScale.scale.scaleColorList)) {
				if (tempScale.scale.scaleColorList.length > 0) {
					colorStr = `background:${tempScale.scale.scaleColorList[0]}`
				}
			}
		}

		return colorStr
	}
	setSelectedScale(index: number): void {
		// 若点击是当前已经选中的 scale index 则将 selectedScaleIndex 改为默认值
		if (index === this.selectedScaleIndex) {
			this.selectedScaleIndex = DEFAULT_DICT_KEY
		} else {
			this.selectedScaleIndex = index
		}
	}
	showScale(index: number): boolean {
		let isShow = false
		if (this.selectedScaleIndex === DEFAULT_DICT_KEY) {
			isShow = true
		}
		if (this.selectedScaleIndex !== DEFAULT_DICT_KEY && index === this.selectedScaleIndex) {
			isShow = true
		}
		return isShow
	}
	get isShowScaleBar(): boolean {
		return this.colorScalesList.length > 0 && this.getIsShowRasterLegend
	}

	/** 监听 common -> GET_ISOSURGE_COLOR_SCALE_VAL_RANGE
	 * 获取当前潮位等值面色标实际值数组
	 */
	@Getter(GET_ISOSURGE_COLOR_SCALE_VAL_RANGE, { namespace: 'common' })
	getIsosurgeColorScaleValRange

	/** 是否加载 raster 图例 */
	@Getter(GET_IS_SHOW_RASTER_LEGEND, { namespace: 'map' })
	getIsShowRasterLegend

	/** 监听 common -> GET_ISOSURGE_COLOR_SCALE_STR_LIST
	 * 获取当前潮位等值面色标颜色str list
	 */
	@Getter(GET_ISOSURGE_COLOR_SCALE_STR_LIST, { namespace: 'common' }) getIsosurgeColorScaleStrList
	/** 监听 common -> GET_ISOSURGE_COLOR_SCALE_VAL_RANGE
	 * 获取当前潮位等值面色标实际值数组
	 */
	@Watch('getIsosurgeColorScaleStrList', { immediate: true, deep: true })
	onIsosurgeColorScaleStrList(scaleList: string[]): void {
		const copyScleList: string[] = scaleList
		const num = copyScleList.length
		this.colorScalesList = scaleList === undefined ? [] : copyScleList.slice(0, num)
	}

	@Watch('getIsosurgeColorScaleValRange', { immediate: true, deep: true })
	onIsosurgeColorScaleValRange(scaleNum: number[]): void {
		this.colorScaleNumList = scaleNum == undefined ? [] : scaleNum
	}

	/** 显示当前网格图层的显示种类 显示等值面则加载此图例 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' }) getScalarShowType

	get isShow(): boolean {
		return this.getScalarShowType === ScalarShowTypeEnum.ISOSURFACE
	}
}
</script>
<style lang="less" scoped>
.color-bar-list {
	margin-top: 10px;
}
.color-bar-list > .color-bar {
	margin-bottom: 5px;
}
.color-bar-list .color-bar {
	margin-bottom: 5px;
}
.color-bar {
	display: flex;
	width: 300px;
	height: 35px;
	border-radius: 0.4em;
	box-shadow: 0 0 4px 0 black;
	// 加入边角弧度并仿制内部填色溢出
	border-radius: 0.4em;
	overflow: hidden;
	.color-bar-title {
		width: 90px;
		display: flex;
		color: aliceblue;
		text-shadow: 0 0 4px black;
	}
	.color-bar-content {
		display: flex;
		justify-content: space-around;
		width: 100%;
	}
	span {
		margin-left: 8px;
		width: 24px;
		color: white;
		text-shadow: 0 0 4px black;
	}
	.color-grid-item {
		// margin-left: 8px;
		width: 20%;
		color: white;
		text-shadow: 0 0 4px black;
		span {
			margin-left: -20px;
		}
	}
	.color-grid-item:last-child {
		// visibility: hidden;
		background: #34495e2a !important;
		backdrop-filter: blur(4px);
	}
	.font-align-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
.color-bar-test {
	width: 300px;
	border-radius: 0.4em;
	box-shadow: 0 0 4px 0 black;
	span {
		margin-left: 8px;
		width: 15px;
		color: white;
	}
}

// 加入过度动画效果
.color-bar-fade-enter-active,
.color-bar-fade-leave-active {
	transition: all 1s;
}
.color-bar-fade-enter, .color-bar-fade-leave-to
/* .list-leave-active for below version 2.1.8 */ {
	opacity: 0;
	transform: translateX(30px);
}
</style>
