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
		<!-- 不适用图层切换菜单 -->
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
	SET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_REGION_PID,
	GET_STATION_CODE,
	GET_NOW,
	GET_ISSUE_TS,
	SET_ISOSURGE_COLOR_SCALE_STR_LIST,
	SET_ISOSURGE_COLOR_SCALE_VAL_RANGE,
	SET_IS_SHOW_RASTER_LEGEND,
	SET_SCALAR_SHOW_TYPE,
	SET_RASTER_COLOR_SCALE_RANGE,
	SET_STATIONS_BASEINFO_LIST,
	GET_SURGE_FORECAST_AREA,
	GET_GLOBAL_SURGE_ISSUE_TS,
	GET_GLOBAL_SURGE_FORECAST_TS,
	SET_TARGET_POSITION_LATLNG,
	GET_GLOBAL_SURGE_FORECAST_PRODUCT,
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
	DEFAULT_LATLNG,
} from '@/const/default'
// enum
import {
	IconTypeEnum,
	RasterFileEnum,
	ScalarShowTypeEnum,
	StationIconShowTypeEnum,
} from '@/enum/common'
import { MenuType, TyScatterMenuType } from '@/enum/menu'
import { ForecastAreaEnum, LayerTypeEnum, MapLayerEnum, RasterLayerEnum } from '@/enum/map'

// api
import { loadTyRealDataList, loadStationTideDataList } from '@/api/typhoon'
import {
	loadStationDetailDataList,
	loadStationNameDict,
	loadInlandStationMaxSurge,
} from '@/api/station'
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
import { Collapse, Loading } from 'element-ui'
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
import { ISurgeRasterLayer, SurgeRasterGeoLayer, SurgeRasterLayer } from './raster'
import { Sosurface } from './isosurface'
import { DEFAULT_COLOR_SCALE } from '@/const/colorBar'
import wave from '@/store/modules/wave'
import { WaveArrow } from './arrow'
import { StationBaseInfo } from './station'
import { WaveBarOptType } from '@/middle_model/geo'
import { loading } from '@/common/common'

// - 23-03-27 api
import { loadSurgeListByRecently } from '@/api/surge' // 获取所有潮位站距离当前最近的潮值
import { loadAllStationStatusJoinGeoInfo, loadAllStationLastSurge } from '@/api/station'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import { IWdSurgeLayerOptions } from './types/types'
import { IScale } from '@/const/colorBar'
import { getIntegerList } from '@/util/math'
import { loadGlobalHourlyCoverageTif } from '@/api/raster'
import { ForecastProductTypeEnum } from '@/enum/surge'

/** 判断本组件内的surge配置是否符合 */
const checkSurgeOpts = (area: ForecastAreaEnum, issueTs: number, forecastTs: number): boolean => {
	let isOk = false
	if (
		area != ForecastAreaEnum.NONE &&
		issueTs != DEFAULT_TIMESTAMP &&
		forecastTs != DEFAULT_TIMESTAMP
	) {
		isOk = true
	}
	return isOk
}

/**
 * - 24 10 全球风暴潮预报map——加载四个预报区域的栅格图层
 *
 */
@Component({
	components: {
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
export default class GlobalForecastMapView extends Vue {
	zoom = 5
	center: number[] = [29.45, 130.8833]
	rasterURL: string = null
	url =
		'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
	// url = 'http://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png'
	// TODO:[-] 20-11-09 新加入的 map 相关的一些基础静态配置
	mapOptions: { preferCanvas: boolean; minZoom: number; maxZoom: number; render: any } = {
		preferCanvas: true,
		minZoom: 3,
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

	uniqueRasterLayerId = DEFAULT_LAYER_ID

	/** 目前添加至map的markers id 集合 */
	markersIdList: number[] = []

	/** 浪向 canvas layer */
	waveArrowCanvasLayer = null

	/** vuex common now 当前时间 */
	@Getter(GET_NOW, { namespace: 'common' })
	now: Date

	/** TODO:[-] 23-02-02 注意修改为通过监听 预报时间戳来执行加载操作(监听 预报Date 会出现多次赋相同值触发多次的问题) */
	forecastTimestamp = 0
	/** 圈选选项 */
	boxOptions = {
		color: '#1abc9c',
		colorOpacity: 0.6,
		background: '#1abc9c',
		backgroundOpacity: 0.7,
	}

	/** 当前的海洋站潮位list */
	surgeStationList: IStationInfo[] = []

	/** 海洋站基础信息 集合 */
	stationBaseInfoList: StationBaseInfoMidModel[] = []

	/** 获取栅格图层的显示类型 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' }) getScalarType: ScalarShowTypeEnum

	created() {}

	mounted() {
		const issueTs = this.getIssueTs
		const that = this

		this.loadBaseStationList()
		this.loadSurgeStationList()
		const mymap: L.Map = this.$refs.basemap['mapObject']
		// 点击地图隐藏 station surge form
		mymap.on('click', (el) => {
			console.log(el)
			that.setShowStationSurgeForm(false)
		})
	}

	/** TODO:[*] 24-11-01 加载逐时增水场layer */
	initHourlySurgeLayer(
		scalarLayerType: ScalarShowTypeEnum,
		area: ForecastAreaEnum,
		issueTs: number,
		forecastTs: number
	): void {
		const scalarList = DEFAULT_COLOR_SCALE.scaleColorList
		const surgeRasterLayer = new SurgeRasterLayer({
			issueTs: issueTs,
			forecastTs: forecastTs,
			scaleList: scalarList,
			area: area,
			layerType: LayerTypeEnum.RASTER_LAYER_HOURLY_SURGE,
		})

		switch (scalarLayerType) {
			case ScalarShowTypeEnum.RASTER:
				this.addSurgeRasterLayer2Map(
					issueTs,
					forecastTs,
					true,
					RasterLayerEnum.RASTER_LAYER,
					LayerTypeEnum.RASTER_LAYER_HOURLY_SURGE,
					surgeRasterLayer
				)
				break

			case ScalarShowTypeEnum.ISOSURFACE:
				// TODO:[*] 24-11-05 需要加入最小值的过滤条件
				const isosurfaceOpts = { filterMin: 0.2 }
				// ReferenceError: Cannot access 'surgeRasterLayer' before initialization
				this.addSurgeIsosurfaceLayer2Map(
					issueTs,
					forecastTs,
					surgeRasterLayer,
					LayerTypeEnum.RASTER_LAYER_HOURLY_SURGE,
					isosurfaceOpts
				)
				break
			default:
				break
		}
	}

	initMaxSurgeLayer(
		scalarLayerType: ScalarShowTypeEnum,
		area: ForecastAreaEnum,
		issueTs: number,
		forecastTs: number
	): void {
		this.$log.info('执行initMaxSurgeLayer')

		const scalarList = DEFAULT_COLOR_SCALE.scaleColorList
		const surgeRasterLayer = new SurgeRasterLayer({
			issueTs: issueTs,
			forecastTs: forecastTs,
			scaleList: scalarList,
			area: area,
			layerType: LayerTypeEnum.RASTER_LAYER_MAX_SURGE,
		})

		switch (scalarLayerType) {
			case ScalarShowTypeEnum.RASTER:
				// const surgeRasterLayer = new SurgeRasterLayer({
				// 	issueTs: issueTs,
				// 	forecastTs: forecastTs,
				// 	scaleList: scalarList,
				// 	area: area,
				// 	layerType: LayerTypeEnum.RASTER_LAYER_MAX_SURGE,
				// })
				this.addSurgeRasterLayer2Map(
					issueTs,
					forecastTs,
					true,
					RasterLayerEnum.RASTER_LAYER,
					LayerTypeEnum.RASTER_LAYER_MAX_SURGE,
					surgeRasterLayer
				)
				break

			case ScalarShowTypeEnum.ISOSURFACE:
				// TODO:[*] 24-11-05 需要加入最小值的过滤条件
				// TODO:[*] 24-12-17 surgeRasterLayer 为栅格实现类，应改为等值面实现类
				const isosurfaceOpts = { filterMin: 0.2 }
				this.addSurgeIsosurfaceLayer2Map(
					issueTs,
					forecastTs,
					surgeRasterLayer,
					LayerTypeEnum.RASTER_LAYER_MAX_SURGE,
					isosurfaceOpts
				)
				break
			default:
				break
		}
	}

	/** 获取当前预报区域 */
	@Getter(GET_SURGE_FORECAST_AREA, { namespace: 'surge' })
	getForecastArea: ForecastAreaEnum

	/** 获取当前发布时间 */
	@Getter(GET_GLOBAL_SURGE_ISSUE_TS, { namespace: 'surge' })
	geGlobalIssueTs: number

	/** 获取当前发布时间的预报时次 */
	@Getter(GET_GLOBAL_SURGE_FORECAST_TS, { namespace: 'surge' })
	geGlobalForecastTs: number

	/**
	 * TODO:[-] 24-12-19
	 * 全球预报产品类型(SURGE_MAX|SURGE_HOURLY) */
	@Getter(GET_GLOBAL_SURGE_FORECAST_PRODUCT, { namespace: 'surge' })
	getGlobalForcastProduct: ForecastProductTypeEnum

	get forecastSurgeOpts(): {
		getScalarType: ScalarShowTypeEnum
		getForecastArea: ForecastAreaEnum
		geGlobalIssueTs: number
		geGlobalForecastTs: number
		getGlobalForcastProduct: ForecastProductTypeEnum
	} {
		const {
			getScalarType,
			getForecastArea,
			geGlobalIssueTs,
			geGlobalForecastTs,
			getGlobalForcastProduct,
		} = this
		return {
			getScalarType,
			getForecastArea,
			geGlobalIssueTs,
			geGlobalForecastTs,
			getGlobalForcastProduct,
		}
	}

	@Watch('forecastSurgeOpts')
	onForecastSurgeOpts(val: {
		getScalarType: ScalarShowTypeEnum
		getForecastArea: ForecastAreaEnum
		geGlobalIssueTs: number
		geGlobalForecastTs: number
		getGlobalForcastProduct: ForecastProductTypeEnum
	}): void {
		if (checkSurgeOpts(val.getForecastArea, val.geGlobalIssueTs, val.geGlobalForecastTs)) {
			// console.log(
			// 	`监听到surge相关配置项发生变化:scalarType:${val.getScalarType}area${val.getForecastArea},issuets:${val.geGlobalIssueTs},forecastTs:${val.geGlobalForecastTs}`
			// )
			// TODO:[-] 24-12-19 加入switch执行 整点|最大增水场
			switch (val.getGlobalForcastProduct) {
				case ForecastProductTypeEnum.SURGE_HOURLY:
					this.initHourlySurgeLayer(
						val.getScalarType,
						val.getForecastArea,
						val.geGlobalIssueTs,
						val.geGlobalForecastTs
					)
					break
				case ForecastProductTypeEnum.SURGE_MAX:
					this.initMaxSurgeLayer(
						val.getScalarType,
						val.getForecastArea,
						val.geGlobalIssueTs,
						val.geGlobalForecastTs
					)
					break
				default:
					break
			}
		}
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

	private clearLayersByIds(ids: number[]): void {
		const that = this
		ids.forEach((id) => {
			// @ts-ignore
			that.clearLayerById(id)
		})
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

	private loadStationAndShow(code: string, position: L.LatLng = DEFAULT_LATLNG): void {
		this.setStationCode(code)
		this.setPositionLatlng(position)
		this.setShowStationSurgeForm(true)
	}

	/** 清除海浪全部图层 */
	clearAllWaveLayers(): void {
		this.clearScalarLayer()
		this.clearSosurfaceLayer()
		this.clearGridTitlesLayer()
	}
	/** 设置台风的时间间隔步长 */
	@Mutation(SET_DATE_STEP, { namespace: 'common' }) setDateStep

	/** 设置当前潮位站 code */
	@Mutation(SET_STATION_CODE, { namespace: 'station' }) setStationCode

	/** 设置当前潮位站的坐标 */
	@Mutation(SET_TARGET_POSITION_LATLNG, { namespace: 'station' }) setPositionLatlng

	/** 设置 显示|隐藏 station surge form */
	@Mutation(SET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) setShowStationSurgeForm

	/** 设置栅格图层色标范围 {
	range?: number[]
	scaleColorList: string | string[]
} */
	@Mutation(SET_RASTER_COLOR_SCALE_RANGE, { namespace: 'common' }) setRasterColorScaleRange: (
		val: IScale
	) => void

	/** 设置当前 潮位等值面色标 实际值数组 */
	@Mutation(SET_ISOSURGE_COLOR_SCALE_VAL_RANGE, { namespace: 'common' })
	setIsoSurgeColorScaleValRange

	/** 设置当前 潮位等值面色标 色标颜色数组 */
	@Mutation(SET_ISOSURGE_COLOR_SCALE_STR_LIST, { namespace: 'common' })
	setIsoSurgeColorScaleStrList

	/** 设置是否显示 raster layer 图例 */
	@Mutation(SET_IS_SHOW_RASTER_LEGEND, { namespace: 'map' })
	setIsShowRasterLayerLegend

	/** 显示网格图层类型 */
	@Mutation(SET_SCALAR_SHOW_TYPE, { namespace: 'common' })
	setScalarShowType

	/** 获取当前地图key */
	@Getter(GET_BASE_MAP_KEY, { namespace: 'map' }) getBaseMapKey

	/** 获取当前的预报时间(不再监听此变量，改为监听forecastTimestamp. ts=Date.getTime() ) */
	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' })
	getForecastDt: Date

	@Getter(GET_REGION_PID, { namespace: 'station' })
	getRegionPid: number

	@Watch('getForecastDt')
	onForecastDt(val: Date) {
		this.forecastTimestamp = val.getTime()
	}

	/** 标量场的显示类型 栅格图层|等值面 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' })
	getScalarShowType: ScalarShowTypeEnum

	@Getter(GET_STATION_CODE, { namespace: 'station' })
	getStationCode: string

	/** 设置当前圈选中心位置 */
	@Mutation(SET_BOX_LOOP_LATLNG, { namespace: 'map' }) setBoxLoopLatlng: (val: L.LatLng) => void

	/** 设置字典基础信息集合 */
	@Mutation(SET_STATIONS_BASEINFO_LIST, { namespace: 'station' }) setStationsBaseInfo: (
		val: StationBaseInfoMidModel[]
	) => void

	/** 当前发布时间戳 */
	@Getter(GET_ISSUE_TS, { namespace: 'common' })
	getIssueTs: number

	/**  加载国内wd各个站位的最大增水 */
	loadInlandStationMaxSurgeList(issueTs: number, is_recent = true): void {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this
		this.clearLayersByIds(this.markersIdList)
		if (is_recent) {
			this.surgeStationList = []
			// step1: 加载大陆的指定发布时间的168小时站点增水极值集合
			// TODO:[-] 23-11-09 由于加载168小时站点增水耗时较长，加入了全局loading
			const loadInstance = Loading.service({
				lock: true,
				fullscreen: true,
				text: '加载中……',
				background: 'rgba(28, 34, 52, 0.733)',
			})
			loadInlandStationMaxSurge(issueTs)
				.then(
					(
						res: IHttpResponse<
							{
								code: string
								surge: number
								name: string
								lat: number
								lon: number
							}[]
						>
					) => {
						let tempStationList: IStationInfo[] = []
						res.data.forEach((temp) => {
							tempStationList.push({
								station_code: temp.code,
								name: temp.name,
								gmt_realtime: new Date(issueTs), // 注意此处为str->date
								lat: temp.lat,
								lon: temp.lon,
								surge: temp.surge,
							})
						})
						this.surgeStationList = tempStationList
					}
				)
				.then((_) => {
					that.markersIdList = addStationIcon2Map(
						mymap,
						this.surgeStationList,
						10,
						[{ name: '123', chname: '' }],
						(msg: { code: string; name: string }) => {
							console.log(`当前点击了code:${msg.code},name:${msg.name}`)
							const filterRes = that.surgeStationList.find((val) => {
								return val.station_code === msg.code
							})
							if (filterRes) {
								const latlng = new L.LatLng(filterRes.lat, filterRes.lon)
								that.loadStationAndShow(msg.code, latlng)
							}
						},
						IconTypeEnum.FIXED_STATION_SURGE_ICON,
						StationIconShowTypeEnum.SHOW_STATION_STATUS,
						that.now
					)
					that.zoom2Country()
				})
				.finally(() => {
					loadInstance.close()
				})
		}
	}

	/** + 24-11-04 加载逐时的增水场 layer to map */
	initHourlySurgeScalarLayer2Map(
		scalarLayerType: ScalarShowTypeEnum,
		issueTs: number,
		forecastTs: number,
		area: ForecastAreaEnum
	): void {
		const scaleList = [
			'#153C83',
			'#4899D9',
			'#FFFB58',
			'#F1C712',
			'#E79325',
			'#F22015',
			'#C40E0F',
		]
		const surgeRasterLayer = new SurgeRasterGeoLayer({
			issueTimestamp: issueTs.toString(),

			scaleList: scaleList,
			customMin: 0, // 自定义下限为0
			customMax: 2, // TODO:[-] 22-04-14 加入的自定义上限为2
			customCoefficient: 0.8,
			customCoeffMax: 1,
			desc: '对于大于1.0的原值,色标会对其乘0.8',
		})
	}

	/**  清除唯一的栅格图层——以后将所有清除 raster 均调用此方法 */
	clearUniquerRasterLayer(): void {
		if (this.uniqueRasterLayerId !== DEFAULT_LAYER_ID) {
			// this.setIsShowRasterLayerLegend(false)
			// @ts-ignore
			this.clearLayerById(this.uniqueRasterLayerId)
			this.uniqueRasterLayerId = DEFAULT_LAYER_ID
		}
	}

	/** 将地图缩放至当前 surgeStationList  */
	zoom2Country(): void {
		if (this.surgeStationList.length > 0) {
			const tempStation = this.surgeStationList[0]

			const tempPostion = new L.LatLng(tempStation.lat, tempStation.lon)
			const mymap: L.Map = this.$refs.basemap['mapObject']
			mymap.setView(tempPostion)
		}
	}

	/** + 23-03-27 加载 潮位站基础信息集合 -> 生成一个集合 */
	async loadBaseStationList(): Promise<void> {
		this.stationBaseInfoList = []
		const stationBaseInfo = new StationBaseInfo()
		await stationBaseInfo.getAllInlandStationInfo()
		this.stationBaseInfoList = stationBaseInfo.allStationBaseInfoList
		this.setStationsBaseInfo(stationBaseInfo.allStationBaseInfoList)
	}

	/** + 23-03-27 加载 指定时间|当前时间 的全部潮位站 */
	loadSurgeStationList(is_recent = true, now: Date = new Date(), pid?: number): void {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this
		this.clearLayersByIds(this.markersIdList)
		if (is_recent) {
			this.surgeStationList = []
			loadAllStationStatusJoinGeoInfo(pid)
				.then(
					(
						res: IHttpResponse<
							{
								station_code: string
								gmt_realtime: string
								status: number
								surge: number
								tid: number
								lat: number
								lon: number
							}[]
						>
					) => {
						let tempStationList: IStationInfo[] = []
						res.data.forEach((temp) => {
							tempStationList.push({
								station_code: temp.station_code,
								gmt_realtime: new Date(temp.gmt_realtime), // 注意此处为str->date
								lat: temp.lat,
								lon: temp.lon,
								surge: temp.surge,
							})
						})
						this.surgeStationList = tempStationList
					}
				)
				.then((_) => {
					that.markersIdList = addStationIcon2Map(
						mymap,
						this.surgeStationList,
						10,
						[{ name: '123', chname: '' }],
						(msg: { code: string; name: string }) => {
							console.log(`当前点击了code:${msg.code},name:${msg.name}`)
							const filterRes = that.surgeStationList.find((val) => {
								return val.station_code === msg.code
							})
							if (filterRes) {
								const latlng = new L.LatLng(filterRes.lat, filterRes.lon)
								that.loadStationAndShow(msg.code, latlng)
							}
						},
						IconTypeEnum.FIXED_CIRCLE_ICON,
						StationIconShowTypeEnum.SHOW_STATION_STATUS,
						that.now
					)
					that.zoom2Country()
				})
		}
	}

	/** +23 -07-07-26 加载潮位栅格图层至地图
	 * step1: * 加载指定的栅格tiff图层
	 */
	async addSurgeRasterLayer2Map(
		issueTs: number,
		forecastTs: number,
		isShow: boolean,
		rasterLayerType: RasterLayerEnum,
		layerType: LayerTypeEnum,
		surgeRasterInstance: ISurgeRasterLayer,
		isosurfaceOpts: { colorScale?: string[]; valScale?: number[] } = {}
	): Promise<void> {
		const that = this
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const forecastDt: Date = new Date(forecastTs)

		if (isShow) {
			this.clearUniquerRasterLayer()
			this.clearSosurfaceLayer()
			this.clearGridTitlesLayer()

			/** 是否加载等 raster layer */
			const isLoadingRasterLayer =
				rasterLayerType == RasterLayerEnum.RASTER_LAYER ? true : false

			surgeRasterInstance
				.add2map(mymap, that.$message, isLoadingRasterLayer, forecastDt, layerType)
				.then((layerId) => {
					// TODO:[-] 23-08-09 根据 raster 的动态范围以及 scaleColorList 的长度切分
					/** 根据 raster 的动态范围以及 scaleColorList 的长度生成色标数组 */
					const customScaleRange: number[] = getIntegerList(
						surgeRasterInstance.scaleRange[1],
						DEFAULT_COLOR_SCALE.scaleColorList.length,
						surgeRasterInstance.scaleRange[0]
					)

					/** 色标实例 */
					const scaleRange: IScale = {
						range: customScaleRange,
						scaleColorList: DEFAULT_COLOR_SCALE.scaleColorList,
					}
					this.setRasterColorScaleRange(scaleRange)
					// this.setScaleDesc(surgeRasterInstance.desc)
					this.uniqueRasterLayerId = layerId
				})
				.then(async (_) => {
					if (!isLoadingRasterLayer && surgeRasterInstance.tiffUrl !== null) {
						// @ts-ignore
					}
				})
				.then((_) => {
					// loadInstance.close()
				})
				.catch((err) => {
					that.$message({
						message: err,
						center: true,
						type: 'warning',
					})
				})
				// @ts-ignore
				.finally((_) => {})
		} else {
			this.clearUniquerRasterLayer()
			this.clearSosurfaceLayer()
			this.clearGridTitlesLayer()
		}
	}

	/** + 23-07-31 加载指定潮位栅格图层->等值面 -> 地图 */
	async addSurgeIsosurfaceLayer2Map(
		issueTs: number,
		forecastTs: number,
		surgeRasterInstance: ISurgeRasterLayer,
		rasterLayerType: LayerTypeEnum,
		isosurfaceOpts: {
			colorScale?: string[]
			valScale?: number[]
			filterMin?: number
			filterMax?: number
		} = {}
	) {
		const that = this
		const issueDt: Date = new Date(issueTs)
		this.clearUniquerRasterLayer()
		this.clearSosurfaceLayer()
		this.clearGridTitlesLayer()
		const mymap: L.Map = this.$refs.basemap['mapObject']
		// 获取tif路径
		const tifUlr: string = await surgeRasterInstance.loadTifUrl(issueDt, rasterLayerType)

		// TODO:[*] 22-06-02 添加等值面
		const maxSosurface = new Sosurface(
			tifUlr,
			isosurfaceOpts
			// sosurfaceOptions
		)
		// 此处会有可能出现错误，对于加载的地主不存在指定文件时会出现错误，但 catch 无法捕捉到
		const sosurfaceOpts = await maxSosurface.addSosurface2MapbyScale(
			mymap,
			that.$message,
			() => {},
			true
		)

		// 对于等值面在 加载 图层后通过 options获取等值面图例
		const valScale =
			isosurfaceOpts.valScale !== undefined ? isosurfaceOpts.valScale : sosurfaceOpts.valScale
		const colorScale =
			isosurfaceOpts.colorScale !== undefined
				? isosurfaceOpts.colorScale
				: sosurfaceOpts.colorScale

		this.setIsoSurgeColorScaleValRange(valScale)
		this.setIsoSurgeColorScaleStrList(colorScale)
		this.setIsShowRasterLayerLegend(true)
		this.setScalarShowType(ScalarShowTypeEnum.ISOSURFACE)
		that.uniqueRasterLayerId = maxSosurface.getLayerId()
		this.gridTitlesLayerId = maxSosurface.getPointsTitleLayerId()
	}

	/** @deprecated
	 * 24-12-05 TODO:[-] 在全球预报中去掉对于 stationcode变化的监听
	 */
	@Watch('getStationCode')
	onStationCode(val: string): void {
		// this.loadStationAndShow(val)
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
					'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
				break
		}
	}

	toHideStationSurgeForm(): void {}
}
</script>
<style lang="less">
@import '../../styles/base';
@import '../../styles/map/my-leaflet';
@import '../../styles/typhoon/typhoonDivicon';
@import '../../styles/station/stationIcon';
@import '../../styles/isosurface/isosurface';

.leaflet-control-attribution {
	a {
		svg {
			visibility: hidden;
		}
	}
}

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
