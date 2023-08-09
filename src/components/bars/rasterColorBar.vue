<template>
	<transition name="color-bar-fade">
		<div class="color-bar-list">
			<transition name="color-bar-fade">
				<div class="color-bar" v-show="isShow">
					<div class="color-bar-title" :style="getBackgroundColorFirstStr(colorScale)">
						<span>单位:m</span>
					</div>
					<div class="color-bar-content" :style="getCustomerStyleObj(colorScale)">
						<span v-for="tempRange in colorScale.scale.range" :key="tempRange.id">{{
							tempRange | formatSurgeFiex1NumStr
						}}</span>
					</div>
				</div>
			</transition>
		</div>
	</transition>
</template>
<script lang="ts">
import { Prop, Vue, Watch } from 'vue-property-decorator'
import Component from 'vue-class-component'
import { Mutation, State, namespace, Getter } from 'vuex-class'
// 本项目
import { IColorScale, ColorScales, IScale, DEFAULT_COLOR_SCALE } from '@/const/colorBar'
import { DEFAULT_DICT_KEY } from '@/const/default'
import {
	SET_SCALE_KEY,
	GET_SCALE_RANGE,
	GET_SCALE_DESC,
	GET_SCALAR_SHOW_TYPE,
	GET_RASTER_COLOR_SCALE_RANGE,
} from '@/store/types'
import { formatSurgeFiex1NumStr } from '@/util/filter'
import { GET_RASTER_LAYER_KEY } from '@/store/types'
import { RasterLayerEnum } from '@/enum/map'
import { ScalarShowTypeEnum } from '@/enum/common'
@Component({
	filters: { formatSurgeFiex1NumStr },
})
export default class RasterColorBar extends Vue {
	// isShow: boolean = false
	colorScale: { key: string; scale: IScale } = {
		key: 'my-colour',
		scale: DEFAULT_COLOR_SCALE,
	}
	selectedScaleIndex = DEFAULT_DICT_KEY
	colorRange: number[] = []
	colorBarDes = ''
	splitNum = 6 // 对当前 range 进行切分的数量
	color1 = 'rgb(151, 75, 145)'
	angle = '50'
	color2 = 'blue'

	toolTip = '对于大于1.0m的增水会色标进行原值*0.8'

	createBackgroundString() {
		const that = this
		console.log(that)
		// return `linear-gradient(${this.angle}deg, ${this.color1}, ${this.color2})`
		// TODO:!] 此种办法也可行
		return `linear-gradient(to right, ${this.color1},  ${this.color2})`
		// return 'rgb(151, 75, 145)'
	}
	getCustomerStyleObj(val: { key: string; scale: IScale }): { backgroundImage: string } {
		let colorStr = ''
		const styleObj: { backgroundImage: string } = { backgroundImage: '' }
		if (val.scale !== undefined && val.scale.scaleColorList !== undefined) {
			if (Array.isArray(val.scale.scaleColorList)) {
				for (const temp of val.scale.scaleColorList) {
					colorStr += temp + ','
				}
				// 需要去掉最后一位的 ,
				colorStr = colorStr.substr(0, colorStr.lastIndexOf(','))
			}
		}

		const colorLinearStr = `linear-gradient(to right, ${colorStr})`
		styleObj.backgroundImage = colorLinearStr
		return styleObj
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
	getBackgroundColorStr(tempScale: { key: string; scale: IScale }): string {
		// eg: #ee4620,#ee462f,#ed4633,#ef6b6d,#f3a4a5,#f9dcdd,#dcdcfe,
		let colorStr = ''
		if (tempScale.scale !== undefined && tempScale.scale.scaleColorList !== undefined) {
			if (Array.isArray(tempScale.scale.scaleColorList)) {
				for (const temp of tempScale.scale.scaleColorList) {
					colorStr += temp + ','
				}
				// 需要去掉最后一位的 ,
				colorStr = colorStr.substr(0, colorStr.lastIndexOf(','))
			}
		}

		const colorLinearStr = `linear-gradient(to right, ${colorStr})`
		return colorLinearStr
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
	@Watch('getColorScaleDesc')
	OnColorBarDesc(desc: string): void {
		this.colorBarDes = desc
	}
	/** + 22-06-16 监听 color bar 的描述信息 */
	@Getter(GET_SCALE_DESC, { namespace: 'common' }) getColorScaleDesc

	/** + 21-08-20 监听 vuex -> color scale range */
	@Getter(GET_RASTER_COLOR_SCALE_RANGE, { namespace: 'common' }) getColorScaleRange

	@Watch('getColorScaleRange')
	onColorScaleRange(val: IScale): void {
		// console.log(range)
		const max = Math.max(...val.range)
		const min = Math.min(...val.range)
		// TODO:[-] 23-08-09 此处修改为 IScale.range
		// const spaceUnit = (max - min) / this.splitNum
		// const rangeList: number[] = []
		// for (let i = 0; i <= this.splitNum; i++) {
		// 	const tempVal = parseFloat((min + i * spaceUnit).toFixed(1))
		// 	rangeList.push(tempVal)
		// }
		this.colorScale = { key: 'my-color', scale: val }
	}

	/** 显示当前网格图层的显示种类 显示等值面则加载此图例 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' }) getScalarShowType

	get isShow(): boolean {
		const isShow = this.getScalarShowType === ScalarShowTypeEnum.RASTER
		return isShow
	}
}
</script>
<style lang="less" scoped>
.color-bar-list {
	margin-top: 2px;
}
.color-bar-list > .color-bar {
	margin-bottom: 5px;
}
.color-bar-list .color-bar {
	margin-bottom: 5px;
}
.color-bar {
	display: flex;
	width: 350px;
	border-radius: 0.4em;
	box-shadow: 0 0 4px 0 black;
	// 加入边角弧度并仿制内部填色溢出
	border-radius: 0.4em;
	overflow: hidden;
	height: 30px;

	.color-bar-title {
		// display: flex;
		width: 120px;
	}
	.color-bar-content {
		display: flex;
		justify-content: space-around;
		width: 100%;
		height: 30px;
		align-items: center;
	}
	span {
		margin-left: 8px;
		width: 24px;
		color: white;
		text-shadow: 0 0 4px black;
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
