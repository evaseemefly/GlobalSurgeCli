import * as L from 'leaflet'
// 20-09-07 引入了raster-marching-squares
import * as d3 from 'd3'
import moment from 'moment'
// 使用leaflet-canvaslayer-field还需要依赖的库
import chroma from 'chroma-js'

// import * as leafletGeotiff from 'leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js'
// TODO:[-] 22-03-21 注意使用此种方式会在 ScalarField.js -> multipleFromGeoTIFF -> const tiff = GeoTIFF.parse(data) 提示找不到 GeoTIFF
import 'leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js'

// import 'leaflet-canvaslayer-field'

// TODO:[-] 20-09-12 暂时放弃使用 d3js，自己手绘，采用现成的第三方库:
// https://github.com/GeoTIFF/georaster-layer-for-leaflet
// 注意使用 该第三方库，依赖于 georaster
import 'georaster'
// 以下方式引入不成功
// import * as georaster from 'georaster'
// https://github.com/GeoTIFF/georaster-layer-for-leaflet
import 'georaster-layer-for-leaflet'
// TODO:[*] 21-08-16 尝试使用geotiff.js
// import * as GeoTIFF from 'geotiff'
import GeoTIFF, { fromUrl, fromUrls, fromArrayBuffer, fromBlob } from 'geotiff'
import * as plotty from 'plotty'
import { ElMessage } from 'element-ui/types/message'

import { WaveScalarRasterTifLayer } from './waveRasterInstance'
import { SurgeMaxScalarRasterTifLayer } from './surgeRasterInstance'

import { LayerTypeEnum } from '@/enum/map'
// COMMON
import { DEFAULT_COLOR_SCALE, DEFAULT_COLOR_KEY, IScale } from '@/const/colorBar'
import {
	DEFAULT_DATE,
	DEFAULT_LAYER_ID,
	DEFAULT_TIMESTAMP,
	DEFAULT_TIMESTAMP_STR,
} from '@/const/default'

export interface IRaster {
	rasterLayer: L.Layer

	/**
	 * 将当前 raster 添加至 map
	 */
	add2map(
		map: L.Map,
		errorCallBackFun: (opt: { message: string; type: string }) => void
	): Promise<L.Layer>
}

/**
 * + 23-01-03
 * 海浪 raster layer 接口
 * @export
 * @interface ISurgeRasterLayer
 */
export interface ISurgeRasterLayer {
	/**
	 * 将 surge 栅格图层 添加至地图中
	 * 执行后可获取对应的 geotiff url
	 *
	 * @param {L.Map} map leaflet map
	 * @param {(ElMessage) => void} errorCallBackFun 出现错误的回调消息 func
	 * @param {boolean} isShowRasterLayer 是否显示 raster 图层
	 * @param {LayerTypeEnum} [coverageType] 加载的图层枚举
	 * @return {*}  {Promise<number>}
	 * @memberof ISurgeRasterLayer
	 */
	add2map(
		map: L.Map,
		errorCallBackFun: (ElMessage) => void,
		isShowRasterLayer: boolean,
		forecastDt: Date,
		coverageType?: LayerTypeEnum
	): Promise<number>

	/**
	 * 色标 list
	 *
	 * @type {(string[] | string)}
	 * @memberof ISurgeRasterLayer
	 */
	scaleList: string[] | string

	/**
	 * 色标范围
	 *
	 * @type {number[]}
	 * @memberof ISurgeRasterLayer
	 */
	scaleRange: number[]

	/**
	 * 获取 raster geotiff 的 url 地址
	 *
	 * @type {string}
	 * @memberof ISurgeRasterLayer
	 */
	tiffUrl: string

	/**
	 * 获取 raster 的描述信息
	 *
	 * @type {string}
	 * @memberof ISurgeRasterLayer
	 */
	desc: string

	loadTifUrl(forecastDt: Date, coverageType?: LayerTypeEnum): Promise<string>
}

class RasterBase {
	/**
	 * name
	 */
}

/**
 * modfiy + 21-08-19
 * 建议在创建时加入scale，可以直接使用 chroma.scale
 * - 22-04-20
 * 该类为 max surge layer 使用
 *
 * @class RasterGeoLayer
 */
class SurgeRasterGeoLayer implements ISurgeRasterLayer {
	options: {
		rasterLayer: L.Layer

		/**
		 * 产品发布时间戳
		 */
		issueTimestamp: string
		/**
		 * 预报的时间
		 *
		 * @type {Date}
		 * @memberof RasterGeoLayer
		 */
		forecastDt: Date

		/**
		 * + 21-08-19 新加入的 chroma.scale 色标变量，在构造函数中给与赋值
		 *
		 * @type {*}
		 * @memberof SurgeRasterGeoLayer
		 */
		scaleList: string[] | string
		customMin?: number
		customMax?: number
		customCoefficient?: number
		customCoeffMax?: number
		desc?: string

		/**
		 * 图层类型
		 */
		layerType?: LayerTypeEnum
	} = {
		rasterLayer: new L.Layer(),

		issueTimestamp: DEFAULT_TIMESTAMP_STR,
		/**
		 * 预报的时间
		 *
		 * @type {Date}
		 * @memberof RasterGeoLayer
		 */
		forecastDt: DEFAULT_DATE,

		/**
		 * + 21-08-19 新加入的 chroma.scale 色标变量，在构造函数中给与赋值
		 *
		 * @type {*}
		 * @memberof SurgeRasterGeoLayer
		 */
		scaleList: DEFAULT_COLOR_SCALE.scaleColorList,

		layerType: LayerTypeEnum.UN_LAYER,
	}

	/** tif 的绝对路径 */
	public abstractTifUrl = ''

	get rasterLayer(): L.Layer {
		return this.options.rasterLayer
	}

	set rasterLayer(layer: L.Layer) {
		this.options.rasterLayer = layer
	}

	/**
	 * @description 产品发布时间
	 * @author evaseemefly
	 * @date 2023/01/04
	 * @readonly
	 * @type {string}
	 * @memberof RasterGeoLayer
	 */
	get issueTimestamp(): string {
		return this.options.issueTimestamp
	}

	/**
	 * @description 获取当前图层种类
	 * @author evaseemefly
	 * @date 2023/01/04
	 * @readonly
	 * @type {LayerTypeEnum}
	 * @memberof RasterGeoLayer
	 */
	get layerType(): LayerTypeEnum {
		return this.options.layerType
	}
	/**
	 * 预报的时间
	 *
	 * @type {Date}
	 * @memberof RasterGeoLayer
	 */
	// forecastDt = this.options.forecastDt
	get forecastDt(): Date {
		return this.options.forecastDt
	}

	get desc(): string {
		return this.options.desc !== undefined ? this.options.desc : '色标'
	}

	/**
	 * + 21-08-19 新加入的 chroma.scale 色标变量，在构造函数中给与赋值
	 *
	 * @type {*}
	 * @memberof RasterGeoLayer
	 */
	// scale = this.options.scale
	get scaleList(): string[] | string {
		return this.options.scaleList
	}
	/**
	 * 色标的范围(乘以了系数=this.rasterMax * this.options.customCoefficient)
	 *
	 * @type {number[]}
	 * @memberof RasterGeoLayer
	 */
	scaleRange: number[] = []
	/**
	 * raster的实际最大值
	 *
	 * @memberof RasterGeoLayer
	 */
	rasterMax = 0
	/**
	 * raster的实际最小值
	 *
	 * @memberof RasterGeoLayer
	 */
	rasterMin = 0

	protected _tiffUrl: string = null

	get tiffUrl(): string {
		return this._tiffUrl
	}
	constructor(options?: {
		issueTimestamp?: string
		scaleList: string[] | string
		customMin?: number
		customMax?: number
		customCoefficient?: number
		customCoeffMax?: number
		desc?: string
	}) {
		this.options = { ...this.options, ...options }
	}

	/**
	 * @description 设置当前的预报时间
	 * @author evaseemefly
	 * @date 2023/01/03
	 * @memberof RasterGeoLayer
	 */
	public set setForecastDt(val: Date) {
		this.options.forecastDt = val
	}

	/**
	 * @description 设置当前图层类型
	 * @author evaseemefly
	 * @date 2023/01/03
	 * @memberof RasterGeoLayer
	 */
	public set setLayerType(val: LayerTypeEnum) {
		this.options.layerType = val
	}

	/**
	 * 若加载错误则会返回 '' ,注意！
	 * {
			"relative_path": "2022/01/01",
			"file_name": "global_ecmwf_det_wve_2022010112_6.tif",
			"file_size": 8116.333984375,
			"host": "localhost",
			"port": 82,
			"area": "images"
		}
	 * @param {string} tyCode
	 * @param {string} tyTs
	 * @return {*}  {string}
	 * @memberof RasterGeoLayer
	 */
	public async getGeoTiff(
		issueTimestamp: string,
		forecastDt: Date,
		layerType: LayerTypeEnum
	): Promise<string> {
		const surgeTif = new SurgeMaxScalarRasterTifLayer<{
			remote_url: string
		}>(issueTimestamp, layerType)

		const awaitUrl = await surgeTif.getGeoTifUrl(forecastDt)
		// const store_url = `http://${awaitUrl.host}:${awaitUrl.port}/images/${awaitUrl.area}/${awaitUrl.relative_path}/${awaitUrl.file_name}`
		const storeUrl: string = awaitUrl.remote_url

		return storeUrl
	}

	public async loadTifUrl(forecastDt: Date, coverageType?: LayerTypeEnum): Promise<string> {
		// TODO:[*] 21-04-30 测试 暂时将 读取的 tif路径写死(最大增水)
		let urlGeoTifUrl = ''
		// eg : {relative_path: '2022/01/01', file_name: 'global_ecmwf_det_wve_2022010112_18.tif', file_size: 8116.333984375}
		// http://localhost:82/images/WAVE/2022/01/01/
		// api返回地址:        localhost:82/images/WAVE/2022/01/01/global_ecmwf_det_wve_2022010112_12.tif
		// 实际地址:    http://localhost:82/images/WAVE/2022/01/01/
		urlGeoTifUrl = await this.getGeoTiff(this.issueTimestamp, forecastDt, coverageType)
		return urlGeoTifUrl
		// this.abstractTifUrl = urlGeoTifUrl
	}

	/**
	 * 根据 this.tyCode, this.tyTimestamp 获取对应的增水场 url 地址，若 isShowRasterLayer =true 则在地图中加载 raster layer
	 * 若 isShowRasterLayer =false 则 只获取 tif url
	 *
	 * @param {L.Map} map
	 * @param {(opt: { message: string; type: string }) => void} pretreatmentCallBackFun
	 * @param {boolean} [isShowRasterLayer=true] 是否在地图中加载 raster layer
	 * @returns {Promise<number>}
	 * @memberof RasterGeoLayer
	 */
	public async add2map(
		map: L.Map,
		pretreatmentCallBackFun: (ElMessage) => void,
		isShowRasterLayer = true,
		forecastDt: Date,
		coverageType?: LayerTypeEnum
	): Promise<number> {
		let layerId: number = DEFAULT_LAYER_ID

		let addedLayer: L.Layer = null
		const that = this
		// TODO:[-] 20-11-04 暂时注释掉，调取远程的文件会出现错误
		// const urlGeoTifUrl = tifResp.data
		const urlGeoTifUrl = await this.loadTifUrl(forecastDt, coverageType)
		// + 22-06-11 此处加入一个手动抛出异常的操作,若需要加载的 geotiff 地址是一个 '' 空值，说明出现了异常直接抛出异常
		if (urlGeoTifUrl === '') {
			throw new Error('不存在指定geotiff路径')
		}
		if (this._tiffUrl == null) {
			this._tiffUrl = urlGeoTifUrl
		}
		// 22-06-02 加入根据 isShowRasterLayer 来实现是否加载 raster 的操作，默认加载
		if (isShowRasterLayer) {
			// 大体思路 获取 geotiff file 的路径，二进制方式读取 -> 使用 georaster 插件实现转换 -> 获取色标，
			// TODO:[-] 20-11-02 将之前的逻辑方式修改为 await 的方式
			// TODO:[-] 20-11-05 在 fetch 请求头中加入跨域的部分
			const fetchHeader = new Headers({
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8,',
			})
			const response = await fetch(urlGeoTifUrl, {
				method: 'GET',
				// headers: fetchHeader,
				mode: 'cors',
			})
			const arrayBuffer = await response.arrayBuffer()
			// 使用 import 'georaster' 的方式引入会出现没有智能提示的问题
			// TODO:[-] 20-11-04
			// Uncaught (in promise) TypeError: Invalid byte order value.
			// at Function.fromSource (e2c99254-e67c-4422-be5d-01e0b254a36b:10)
			// @ts-ignore
			const georasterResponse: any = await parseGeoraster(arrayBuffer)
			// TODO:[-] 22-04-14 加入 栅格的范围是否由 options.custom 定义
			const min: number = this.options.customMin
				? this.options.customMin
				: georasterResponse.mins[0]
			// TODO:[-] 22-04-15 若增水大于1m，则整个场*0.8，所以对于max*0.8
			const rasterMax = georasterResponse.maxs[0]
			this.rasterMax = rasterMax
			this.rasterMin = min
			const max = rasterMax
			// - 22-04-15 此处注释掉
			// if (this.options.customCoeffMax && rasterMax > this.options.customCoeffMax) {
			//     max =
			//         this.options.customCoefficient && this.options.customCoeffMax
			//             ? this.options.customCoefficient * rasterMax
			//             : georasterResponse.maxs[0]
			// }
			// TODO:[-] 22-04-15 此处修改为 range 为色标要求的范围
			// const range = georasterResponse.ranges[0]
			const range: number = max - min
			// const scale = chroma.scale('Viridis')
			// TODO:[*] 21-08-19 error: chroma 错误
			// chroma.js?6149:180 Uncaught (in promise) Error: unknown format: #ee4620,#ee462f,#ed4633,#ef6b6d,#f3a4a5,#f9dcdd,#dcdcfe
			// TODO:[-] 22-04-15 手动设置色标
			// TODO:[*] 22-04-20 注意此处需要对scaleList 进行修改加入最后一个色标
			const scaleList = [...this.options.scaleList]
			if (
				that.options.customCoeffMax &&
				that.options.customCoefficient &&
				rasterMax > that.options.customCoeffMax
			) {
				scaleList.push(scaleList[scaleList.length - 1])
			}
			const scale = chroma.scale(scaleList)
			this.scaleRange = [min, max * this.options.customCoefficient]
			// scale.domain(this.scaleRange)

			// TODO:[*] 21-02-10 此处当加载全球风场的geotiff时，y不在实际范围内，需要手动处理

			// @ts-ignore
			const layer = new GeoRasterLayer({
				georaster: georasterResponse,
				opacity: 0.6,
				pixelValuesToColorFn: function (pixelValues) {
					const pixelValue = pixelValues[0] // there's just one band in this raster
					// TODO:[-] 22-04-15 此处加入对于极值大于1.0米的增水将像素值乘以一个系数0.8
					// if (that.options.customCoeffMax && rasterMax > this.options.customCoeffMax) {
					//     pixelValue = pixelValue * this.options.customCoefficient
					// }

					// if there's zero wind, don't return a color
					// TODO:[-] 22-01-20 由于最大增水场可能会出现 pixelValue 为 0 的情况，所以需要剔除掉===0的判断
					// if (pixelValue === 0 || Number.isNaN(pixelValue)) return null
					// 注意此处有出现 该值超过1的情况
					const scaledPixelValue = (pixelValue - min) / range

					if (Number.isNaN(pixelValue)) return null
					let color = ''
					if (
						that.options.customCoeffMax &&
						that.options.customCoefficient &&
						rasterMax > that.options.customCoeffMax
					) {
						color = scale(scaledPixelValue * (1 / that.options.customCoefficient)).hex()
						// color = scale(scaledPixelValue).hex()
					} else {
						color = scale(scaledPixelValue).hex()
					}

					return color
				},
				resolution: 256,
			})
			const forecastDtStr: string = moment(forecastDt).format('MM-DD HH:mm')
			pretreatmentCallBackFun({ message: `加载${forecastDtStr}预报时刻成功!` })
			addedLayer = layer.addTo(map)
			// @ts-ignore
			layerId = addedLayer._leaflet_id
		}
		return layerId
	}

	/**
	 * 判断指定url的文件是否存在
	 *
	 * @private
	 * @param {string} url
	 * @return {*}  {boolean}
	 * @memberof SurgeRasterGeoLayer
	 */
	protected checkRemoteFileExist(url: string): boolean {
		const xhr = new XMLHttpRequest()
		let isExist = false
		xhr.onreadystatechange = function () {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				// console.log('存在！')
				isExist = true
			}
		}
		xhr.open('HEAD', url)
		return isExist
	}
}

export { SurgeRasterGeoLayer }
