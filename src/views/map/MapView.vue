<template>
	<div id="map_content" v-loading="loading" element-loading-background="rgba(28, 34, 52, 0.733)">
		<l-map
			ref="basemap"
			:zoom="zoom"
			:center="center"
			:options="mapOptions"
			:maxZoom="mapOptions.maxZoom"
			:minZoom="mapOptions.minZoom"
			id="ceshimap"
		>
			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
			<l-wms-tile-layer
				:baseUrl="ninelineWMS.url"
				:layers="ninelineWMS.options.layer"
				:format="ninelineWMS.options.format"
				:transparent="ninelineWMS.options.transparent"
			></l-wms-tile-layer>
			<!-- 南海岛礁 -->
			<l-wms-tile-layer
				:baseUrl="southlandWMS.url"
				:layers="southlandWMS.options.layer"
				:format="southlandWMS.options.format"
				:transparent="southlandWMS.options.transparent"
			></l-wms-tile-layer>

			<!-- TODO:[-] 20-08-26 新加入的世界国境线 -->
			<l-wms-tile-layer
				:baseUrl="worldLineWMS.url"
				:layers="worldLineWMS.options.layer"
				:format="worldLineWMS.options.format"
				:transparent="worldLineWMS.options.transparent"
				:zIndex="worldLineWMS.options.zindex"
			></l-wms-tile-layer>

			<LCircle
				:lat-lng="currentLatlng"
				:radius="boxRadius * boxRadiusUnit"
				:opacity="boxOptions.colorOpacity"
				:color="boxOptions.background"
				:fillColor="boxOptions.background"
				:fillOpacity="boxOptions.backgroundOpacity"
				:visible="getSelectLoop"
			></LCircle>
		</l-map>
		<LayersNavMenuView></LayersNavMenuView>
	</div>
</template>
<script lang="ts">
// vue 相关组件
import { Component, Prop, Vue, Watch, Emit } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import { mixins } from 'vue-class-component'
// gis引擎组件
import * as L from 'leaflet'
import {
	LMap,
	LTileLayer,
	LMarker,
	LPopup,
	LPolyline,
	LPolygon,
	LCircle,
	LIcon,
	LWMSTileLayer,
	LGeoJson,
	LRectangle,
	// LeafletHeatmap
} from 'vue2-leaflet'

// mixin
import { WMSMixin } from '@/views/map/mixin/wmsMixin'
import { MapMixin } from '@/views/map/mixin/mapMixin'
// mid model
import { FilterTyMidModel, TyRealDataMongoMidModel } from '@/middle_model/typhoon'
import { ISearchTyStationParams } from '@/middle_model/api_params'
import { TyphoonCircleStatus, TyCMAPathLine } from '@/middle_model/leaflet_plugin'
import { addStationIcon2Map, IconTyphoonCirlePulsing } from '@/middle_model/icon'
// 接口类
import { IStationIcon, IStationInfo } from '@/interface/station'
import { IHttpResponse } from '@/interface/common'
import { IPoint } from '@/interface/geo'
import { ITyphoonParams4Station } from '@/interface/station'

// store
import {
	GET_IS_SELECT_LOOP,
	GET_BOX_LOOP_RADIUS,
	GET_CURRENT_TY,
	SET_DATE_STEP,
	GET_BASE_MAP_KEY,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	GET_CURRENT_FORECAST_DT,
	SET_BOX_LOOP_LATLNG,
	GET_SCALAR_SHOW_TYPE,
} from '@/store/types'
// 默认常量
import {
	DEFAULT_BOX_LOOP_RADIUS,
	DEFAULT_BOX_LOOP_RADIUS_UNIT,
	DEFAULT_BOX_LOOP_LATLNG,
	DEFAULT_LAYER_ID,
	DEFAULT_DATE,
	DEFAULT_TY_CODE,
	DEFAULT_TY_NAME_CH,
	DEFAULT_TY_NAME,
	DEFAULT_TY_NUM,
	DEFAULT_STATION_NAME,
	DEFAULT_SURGE_VAL,
	DEFAULT_STATION_CODE,
	DEFAULT_TIMESTAMP,
} from '@/const/default'
// enum
import { IconTypeEnum, ScalarShowTypeEnum } from '@/enum/common'
import { MenuType, TyScatterMenuType } from '@/enum/menu'
import { LayerTypeEnum, MapLayerEnum } from '@/enum/map'

// api
import { loadTyRealDataList, loadStationTideDataList } from '@/api/typhoon'
import { loadStationDetailDataList, loadStationNameDict } from '@/api/station'
// 各类插件
import { TyMiniMarker } from '@/plugins/customerMarker'
import {
	AbsBaseTyHeatmap,
	AbsBaseTyScatter,
	TyRadiusHeatMap,
	TyRadiusScatter,
	TyUniqueFilterScatter,
	TyUniquerFilterHeatMap,
} from '@/plugins/scatter'
// 工具类
import { convertTyRealDataMongo2TyCMAPathLine } from '@/middle_model/util'
import moment from 'moment'
import { ITyPath } from '@/interface/typhoon'
import { Collapse } from 'element-ui'
import station from '@/store/modules/station'
// 第三方插件
// 当前布局会导致此热图插件出错，暂时无法解决
// 以前使用的 heatmap 出现了问题，暂时不使用
// 方式1: 使用 heatmap.js 并使用对应 leaflet-heatmap.js 插件
import 'heatmap.js'
import HeatmapOverlay from '@/plugins/leaflet-heatmap.js'

// 其余组件
import LayersNavMenuView from '@/components/nav/LayersNavMenuView.vue'

// 引入事件总线
import { EventBus } from '@/bus/BUS'
import {
	TO_CLEAR_ALL_LAYER,
	TO_FILTER_TY_PATH_LIST,
	TO_GET_UNIQUE_TY_SEARCH_READ_DATA,
} from '@/bus/types'
import { FilterType4ScattersEnum, FilterTypeEnum } from '@/enum/filter'
import { MS_UNIT } from '@/const/unit'
import { WaveRasterGeoLayer } from './raster'
import { Sosurface } from './isosurface'
import { DEFAULT_COLOR_SCALE } from '@/const/colorBar'
import wave from '@/store/modules/wave'
import { WaveArrow } from './arrow'
import { WaveBarOptType } from '@/middle_model/geo'

@Component({
	components: {
		// LMarker,
		// LMap,
		// LTileLayer,
		// LPolyline,
		// LCircle,
		// LIcon,
		// LWMSTileLayer,
		// LGeoJson,
		// LPolygon,
		// LRectangle,
		'l-marker': LMarker,
		'l-map': LMap,
		'l-tile-layer': LTileLayer,
		'l-polyline': LPolyline,
		LCircle,
		'l-icon': LIcon,
		'l-wms-tile-layer': LWMSTileLayer,
		'l-geo-json': LGeoJson,
		'l-polygon': LPolygon,
		'l-rectangle': LRectangle,
		LayersNavMenuView,
	},
	mixins: [WMSMixin, MapMixin],
})
export default class MainMapView extends Vue {
	zoom = 5
	center: number[] = [27.45, 130.8833]
	url =
		'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}'
	// url = 'http://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png'
	// TODO:[-] 20-11-09 新加入的 map 相关的一些基础静态配置
	mapOptions: { preferCanvas: boolean; minZoom: number; maxZoom: number; render: any } = {
		preferCanvas: true,
		minZoom: 4,
		// 可缩放的最大 level
		maxZoom: 11,
		// 目前已经使用了 canvas 渲染
		render: L.canvas(),
	}

	isSelectLoop = false
	/** 当前窗口正在加载 */
	loading = false
	/** 当前点击的位置 */
	currentLatlng: L.LatLng = new L.LatLng(28, 130)
	/** 圈选半径 */
	boxRadius = DEFAULT_BOX_LOOP_RADIUS
	/** 圈选半径基础单位 */
	boxRadiusUnit = DEFAULT_BOX_LOOP_RADIUS_UNIT
	/** 临时的台风marker 主要显示 时间,bp */
	tempTyMarker: L.Marker<any> = null

	/** 当前标量场 layer id */
	scalarLayerId = DEFAULT_LAYER_ID

	/** 等值面的 layer id */
	sosurfaceLayerId = DEFAULT_LAYER_ID

	/** 格点文字 layer id */
	gridTitlesLayerId = DEFAULT_LAYER_ID

	/** 浪向 canvas layer */
	waveArrowCanvasLayer = null
	now: Date = new Date()

	/** TODO:[-] 23-02-02 注意修改为通过监听 预报时间戳来执行加载操作(监听 预报Date 会出现多次赋相同值触发多次的问题) */
	forecastTimestamp = 0
	/** 圈选选项 */
	boxOptions = {
		color: '#1abc9c',
		colorOpacity: 0.6,
		background: '#1abc9c',
		backgroundOpacity: 0.7,
	}

	/** true:进行地图打点操作 */
	@Getter(GET_IS_SELECT_LOOP, { namespace: 'map' }) getSelectLoop: boolean

	@Getter(GET_BOX_LOOP_RADIUS, { namespace: 'map' }) getBoxLoopRadius: number

	@Getter(GET_CURRENT_TY, { namespace: 'typhoon' }) getCurrentTy

	created() {}

	mounted() {
		const self = this
		// TODO:[-] 23-02-03 此处修改为加载地图完毕后只要点击地图就记录当前点击所在位置
		const mymap: L.Map = this.$refs.basemap['mapObject']
		mymap.on('click', (e: L.LeafletMouseEvent) => {
			// @ts-ignore
			self.currentLatlng = e.latlng
			this.setBoxLoopLatlng(e.latlng)
		})
	}

	/** 清除当前选定的圈选位置的中心点 */
	private clearCurrentLatlng(): void {
		this.currentLatlng = null
	}

	/** 清除当前的 标量场栅格图层 */
	private clearScalarLayer(): void {
		if (this.scalarLayerId != DEFAULT_LAYER_ID) {
			// @ts-ignore
			this.clearLayerById(this.scalarLayerId)
		}
	}

	/** 清除当前的 等值面图层 */
	private clearSosurfaceLayer(): void {
		if (this.sosurfaceLayerId != DEFAULT_LAYER_ID) {
			// @ts-ignore
			this.clearLayerById(this.sosurfaceLayerId)
		}
	}

	/** 清除当前的 格点数值图层 */
	private clearGridTitlesLayer(): void {
		if (this.gridTitlesLayerId != DEFAULT_LAYER_ID) {
			// @ts-ignore
			this.clearLayerById(this.gridTitlesLayerId)
		}
	}

	/** 清除当前的 海浪箭头 canvas 图层 */
	private clearWaveArrowCanvasLayer(): void {
		if (this.waveArrowCanvasLayer === null || this.waveArrowCanvasLayer === undefined) {
			return
		} else {
			this.waveArrowCanvasLayer.clearLayers()
		}
	}

	/** 清除海浪全部图层 */
	clearAllWaveLayers(): void {
		this.clearScalarLayer()
		this.clearSosurfaceLayer()
		this.clearGridTitlesLayer()
		this.clearWaveArrowCanvasLayer()
	}
	/** 设置台风的时间间隔步长 */
	@Mutation(SET_DATE_STEP, { namespace: 'common' }) setDateStep

	/** 获取当前地图key */
	@Getter(GET_BASE_MAP_KEY, { namespace: 'map' }) getBaseMapKey

	/** 获取当前产品的发布时间 */
	@Getter(GET_WAVE_PRODUCT_ISSUE_DATETIME, { namespace: 'wave' })
	getWaveProductIssueDt: Date

	/** 获取当前产品的发布时间戳 */
	@Getter(GET_WAVE_PRODUCT_ISSUE_TIMESTAMP, { namespace: 'wave' })
	getWaveProductIssueTimestamp: number

	/** 获取当前选中的海浪产品图层 */
	@Getter(GET_WAVE_PRODUCT_LAYER_TYPE, { namespace: 'wave' })
	getWaveProductLayerType: LayerTypeEnum

	/** 获取当前的预报时间(不再监听此变量，改为监听forecastTimestamp. ts=Date.getTime() ) */
	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' })
	getForecastDt: Date

	@Watch('getForecastDt')
	onForecastDt(val: Date) {
		this.forecastTimestamp = val.getTime()
	}

	/** 标量场的显示类型 栅格图层|等值面 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' })
	getScalarShowType: ScalarShowTypeEnum

	/** 海浪标量场配置项 */
	get waveScalarOpts(): {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
		forecastTimestamp: number
		getScalarShowType: ScalarShowTypeEnum
	} {
		const {
			getWaveProductIssueTimestamp,
			getWaveProductLayerType,
			forecastTimestamp,
			getScalarShowType,
		} = this
		return {
			getWaveProductIssueTimestamp,
			getWaveProductLayerType,
			forecastTimestamp,
			getScalarShowType,
		}
	}

	/** 设置当前圈选中心位置 */
	@Mutation(SET_BOX_LOOP_LATLNG, { namespace: 'map' }) setBoxLoopLatlng: (val: L.LatLng) => void

	/** 监听海浪标量场配置项 */
	@Watch('waveScalarOpts')
	async onWaveScalarOpts(val: {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
		getScalarShowType: ScalarShowTypeEnum
		forecastTimestamp: number
	}): Promise<void> {
		this.queue.push(val)
	}

	/** + 23-02-02 加载标量及矢量图层 */
	async asyncLoadScalarLayer(val: {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
		getScalarShowType: ScalarShowTypeEnum
		forecastTimestamp: number
	}): Promise<void> {
		// @ts-ignore
		const mymap = this.$refs.basemap.mapObject
		const self = this
		const forecastDt: Date = new Date(this.forecastTimestamp)
		// TODO:[*] 23-02-02
		if (
			val.getWaveProductIssueTimestamp != DEFAULT_TIMESTAMP &&
			val.getWaveProductLayerType != LayerTypeEnum.UN_LAYER &&
			val.forecastTimestamp != DEFAULT_DATE.getTime()
		) {
			// this.clearScalarLayer()
			// this.clearSosurfaceLayer()
			// this.clearGridTitlesLayer()
			// this.clearWaveArrowCanvasLayer()
			this.clearAllWaveLayers()
			if (
				[
					LayerTypeEnum.RASTER_LAYER_WVE,
					LayerTypeEnum.RASTER_LAYER_SHWW,
					LayerTypeEnum.RASTER_LAYER_MWP,
					LayerTypeEnum.RASTER_LAYER_MWP,
				].findIndex((temp) => {
					return temp === val.getWaveProductLayerType
				}) >= 0
			) {
				// if (val.getWaveProductLayerType === LayerTypeEnum.RASTER_LAYER_WVE) {

				// TODO:[*] 23-02-02 当从其他标量图层并选定时间后切换为其他标量图层会执行两次 。 一次 起始时刻 ， 一次当前选中的时刻
				console.log(
					`加载当前:${new Date(val.forecastTimestamp)}栅格,类型:${
						val.getWaveProductLayerType
					}`
				)
				const waveRasterLayer: WaveRasterGeoLayer = new WaveRasterGeoLayer({
					issueTimestamp: val.getWaveProductIssueTimestamp.toString(),
					scaleList: [
						'#153C83',
						'#4899D9',
						'#FFFB58',
						'#F1C712',
						'#E79325',
						'#F22015',
						'#C40E0F',
					],
				})
				/** tif 的绝对路径 */
				const abstractTifUrl = await waveRasterLayer.loadTifUrl(
					forecastDt,
					val.getWaveProductLayerType
				)

				// 根据 标量场的展示类型 -> 加载栅格图层
				//					   -> 加载等值面
				switch (val.getScalarShowType) {
					case ScalarShowTypeEnum.RASTER:
						await waveRasterLayer
							.add2map(
								mymap,
								() => {
									// console.log(`执行加载raster的清除当前全部涂层的回调函数@`)
									self.clearAllWaveLayers()
								},
								true,
								forecastDt,
								val.getWaveProductLayerType
							)
							.then((_id) => {
								console.log(`${_id}栅格图层加载完毕!`)
								this.scalarLayerId = _id
							})
						break
					case ScalarShowTypeEnum.ISOSURFACE:
						const waveSosurface: Sosurface = new Sosurface(abstractTifUrl)
						// TODO:[*] 23-02-03 在加载等值面之前执行清除海浪全部图层的操作
						self.clearAllWaveLayers()
						const sosurfaceOpts = await waveSosurface.addSosurface2MapbyScale(
							mymap,
							self.$message,
							() => {
								self.clearAllWaveLayers()
							},
							true
						)
						// @ts-ignore
						self.sosurfaceLayerId = waveSosurface.getLayerId()
						self.gridTitlesLayerId = waveSosurface.getPointsTitleLayerId()
						break
					default:
						break
				}
			} else if (val.getWaveProductLayerType === LayerTypeEnum.RASTER_LAYER_MWD) {
				const waveArrow = new WaveArrow()

				// TODO:[-] 23-01-16 注意 moment().valueOf() 单位为 ms 需要转换为 s
				// 清除海浪箭头图层
				this.clearWaveArrowCanvasLayer()
				this.waveArrowCanvasLayer = await waveArrow.add2map(
					mymap,
					new WaveBarOptType(
						(moment(forecastDt).valueOf() / MS_UNIT).toString(),
						val.getWaveProductIssueTimestamp.toString(),
						4
					)
				)
			}
		}
	}

	@Watch('queue')
	async onQueue(
		val: {
			getWaveProductIssueTimestamp: number
			getWaveProductLayerType: LayerTypeEnum
			getScalarShowType: ScalarShowTypeEnum
			forecastTimestamp: number
		}[]
	): Promise<void> {
		const self = this
		// console.log(`监听到queue发生变化!${val}`)

		for (let _ of this.queue) {
			let fn = this.queue.pop()
			await self.asyncLoadScalarLayer(fn)
			// console.log(fn)
		}
		// val.forEach((temp) => {

		// })
	}

	/** 加载图层通道 */
	queue: {
		getWaveProductIssueTimestamp: number
		getWaveProductLayerType: LayerTypeEnum
		getScalarShowType: ScalarShowTypeEnum
		forecastTimestamp: number
	}[] = []

	@Watch('getSelectLoop')
	onSelectLoop(val: boolean): void {
		// TODO:[-] 23-02-03 此处修改为加载地图完毕后只要点击地图就记录当前点击所在位置,以下暂时注释掉
		// this.isSelectLoop = val
		// const mymap: L.Map = this.$refs.basemap['mapObject']
		// const self = this
		// if (val) {
		// 	mymap.on('click', (e: L.LeafletMouseEvent) => {
		// 		// @ts-ignore
		// 		self.currentLatlng = e.latlng
		// 		this.setBoxLoopLatlng(e.latlng)
		// 	})
		// } else {
		// 	mymap.off('mousedown')
		// }
	}

	@Watch('getBaseMapKey')
	onBaseMapKey(val: MapLayerEnum): void {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		switch (true) {
			// case val === MapLayerEnum.SATELITE_MAP:
			//     this.url = `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${MAPTITLELAYER_TOKEN_KEY}`
			case val === MapLayerEnum.SATELITE_MAP:
				this.url = 'http://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png'

				// this.getMapBoxLayerClass('0TuB9SR4KyaoCi4FUrPM').addTo(mymap)
				break
			case val === MapLayerEnum.SIMPLE_MAP:
				// 使用 geoq 的底图
				this.url =
					'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}'
				break
		}
	}
}
</script>
<style lang="less">
@import '../../styles/base';
@import '../../styles/map/my-leaflet';
@import '../../styles/typhoon/typhoonDivicon';
@import '../../styles/station/stationIcon';
@import '../../styles/isosurface/isosurface';

#map_content {
	// 此处放在base.less中的@centermap中
	// padding: 10px;
	flex: 5;
	display: flex;
	flex-direction: column;
	// 留出右侧的 信息栏 的位置
	// margin-right: 50px;
	@centermap();
	@center();

	#process {
		display: flex;
		z-index: 1500;
		width: 100%;

		.progress {
			width: 100%;
		}
	}

	// TODO:[-] 20-06-18 添加的 overlayer 的样式
	.leaflet-control-layers-list label {
		color: black !important;
	}

	// 20-08-04 覆盖一下leaflet的control-zoom 样式
	.leaflet-control-container {
		.leaflet-top {
			top: 60px;
		}
	}
}
</style>
