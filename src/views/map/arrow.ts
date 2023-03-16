import * as L from 'leaflet'

// TODO: 注意我目前使用的是 https://github.com/eJuke/Leaflet.Canvas-Markers，注意与上面的区别！！
// import '@/common/canvasMakerLayer'
import { CanvasMarkerLayer } from '@/common/canvasMakerLayer'
import { CanvasIconLayer } from '@/common/sourceCanvasMarkerLayer'
// TODO:[-] 23-01-13 使用国内替代插件 https://gitee.com/panzhiyue/Leaflet-CanvasMarker
// import { CanvasMarkerLayer } from '@panzhiyue/leaflet-canvasmarker'

// 尝试第三种方式 https://github.com/francoisromain/leaflet-markers-canvas
import 'leaflet-markers-canvas'

// icon 要根据指定角度进行旋转
// 引用插件:https://github.com/bbecquet/Leaflet.RotatedMarker
// import 'leaflet-rotatedmarker'

// import * as RotateMarker from '@/common/rotateMarker'
import { RotateMarker } from '@/common/rotateMarker'

// 引入 api
import { loadWaveDirProductList } from '@/api/wave'

// 20-10-22 引入 查询 mid model
import { WaveBarOptType } from '@/middle_model/geo'
import { LayerTypeEnum } from '@/enum/map'
import { ForecastAreaTypeEnum } from '@/enum/area'
import { IHttpResponse } from '@/interface/common'
export interface IArrow {
	/**
	 * 添加至地图中
	 *
	 * @param {*} map
	 * @memberof IArrow
	 */
	add2map(map: L.Map, barOpt: WaveBarOptType): Promise<L.Layer>

	/**
	 * + 21-03-31 由于 风场 + 海浪 据需要加载全球(至多)范围的数据，所以改为分页加载，加入了pageIndex
	 *
	 * @param {L.Map} map
	 * @param {WindBarOptMidModel} windbarOpt
	 * @param {number} pageIndex
	 * @return {*}  {Promise<L.Layer>}
	 * @memberof IArrow
	 */
	// add2mapGlobal(map: L.Map, barOpt: WaveBarOptType, pageIndex: number): Promise<L.Layer>

	/**
	 * 清除 layers
	 *
	 * @memberof IArrow
	 */
	clearLayers(map: L.Map): void
}

/**
 * 海浪浪向
 *
 * @class WaveArrow
 */
class WaveArrow implements IArrow {
	private _canvasMarkerLayer: L.Layer
	// TODO:[-] 21-02-08 新加入的 canvasMarkerLayer 数组
	private _canvasMarkerLayers: L.Layer[] = []

	private _canvasMarkerLayersGroup: L.LayerGroup

	private _canvasMarkerIds: number[] = []
	testLayer = 23

	/**
	 * 新加入的 canvasMarkerLayer 存取器
	 *
	 * @private
	 * @memberof WindArrow
	 */
	private set canvasMarkerLayer(layer: L.Layer) {
		this._canvasMarkerLayer = layer
	}

	private get canvasMarkerLayer(): L.Layer {
		return this._canvasMarkerLayer
	}
	/**
	 * 从map中清除 WindArrow layer
	 *
	 * @param {L.Map} map
	 * @memberof WindArrow
	 */
	clearLayers(map: L.Map): void {
		const that = this
		if (that._canvasMarkerLayers.length > 0) {
			this._canvasMarkerLayers.forEach((markerTemp) => {
				map.removeLayer(markerTemp)
			})
		}
		// this.canvasMarkerLayer.clearLayers()

		// throw new Error('Method not implemented.')
	}

	/**
	 * 将layer 添加至 map 中
	 * 20-10-30
	 * 重新做了修改，将返回的this.canvasMarkerLayer -> CanvasLayerMidModel
	 * @param {L.Map} map
	 * @returns {Promise<L.Layer>} canvasMarkerLayer
	 * @memberof WindArrow
	 */
	async add2map(map: L.Map, barOpt: WaveBarOptType): Promise<L.Layer> {
		const myself = this
		const markers: L.Marker<any>[] = []
		// const my_self=this
		await loadWaveDirProductList(
			LayerTypeEnum.RASTER_LAYER_MWD,
			barOpt.issueTimestamp,
			barOpt.forecastTimestamp
		).then(
			(
				res: IHttpResponse<{
					unit: number
					step: number
					forecast_timestamp: number
					issue_timestamp: number
					coverage_type: LayerTypeEnum
					forecast_area: ForecastAreaTypeEnum
					list_wave_dir: {
						wave_dir: number
						coords: { type: string; coordinates: number[] }
					}[]
				}>
			) => {
				if (res.status === 200) {
					/*
					 {
						"unit": 1.0,
						"step": 4,
						"forecast_timestamp": 1641038400,
						"issue_timestamp": 1641038400,
						"coverage_type": 2003,
						"forecast_area": 1,
						"list_wave_dir": [
							{
								"wave_dir": 354,
								"coords": {
									"type": "Point",
									"coordinates": [
										50,
										142
									]
								}
							},
						]
					}
                	*/
					const waveBarList: {
						lat: number
						lon: number
						dir: number
					}[] = []
					const myRender = L.canvas({ padding: 0.5 })
					res.data.list_wave_dir.forEach((element) => {
						waveBarList.push({
							lat: element.coords.coordinates[0],
							lon: element.coords.coordinates[1],
							dir: element.wave_dir,
						})
					})

					// const ciLayer: L.Layer = new CanvasMarkerLayer()
					if (this.canvasMarkerLayer !== undefined) {
						this.clearLayers(map)
					}
					if (this.canvasMarkerLayer === undefined) {
						// console.log('已清除')
					}

					waveBarList.forEach(function (p) {
						const absDir = p.dir < 0 ? 360 + p.dir : p.dir
						if (absDir > 360 || absDir < 0) {
							console.log(absDir)
						}
						const spdImgSrc: string = myself.getSpdImg(0)
						// TODO:[-] 20-10-27 暂时去掉
						// const htmlDiv = `<img src="${spdImgSrc}"style="-webkit-transform: rotate(${absDir}deg); -moz-transform:rotate(${absDir}deg);">`
						// 实现方式4:
						// 测试官方demo的icon是否可行
						// [x] 提供图片的方式可行
						// [x] 测试对图片进行旋转
						const iconDemo = L.icon({
							iconUrl: spdImgSrc,
							iconSize: [20, 18],
							iconAnchor: [10, 9],
						})

						const marker = L.marker([p.lat, p.lon], {
							// 保留可行的，但是会影响性能的方式
							// icon: iconDiv
							// 尝试 canvasMarker 的方式
							icon: iconDemo,
							// ---
							// @ts-ignore
							// 使用了 https://github.com/bbecquet/Leaflet.RotatedMarker 旋转marker 的插件，但使用此插件会与 @panzhiyue/leaflet-canvasmarker 冲突，导致生成的marker无法旋转
							rotationAngle: absDir,
						}).bindPopup('I Am ' + p)

						// @ts-ignore
						const rotatemarker = new RotateMarker([p.lat, p.lon], {
							icon: iconDemo,
							rotate: absDir,
						})
						// ---
						markers.push(marker)
					})

					// 使用canvas 渲染
					if (waveBarList.length > 0) {
						// TODO:[*] 23-01-13 此处存在必须手动拖动才能触发加载的bug,且无法解决
						// TODO:[-] 20-10-26 不在此处 addTo map ，改在外侧
						// const canvasMarkerLayer = new CanvasMarkerLayer()
						// let ciLayer: L.Layer | null = null
						// 会出现叠加至地图上无法显示，需要手动拖动后才能显示
						// @ts-ignore
						const ciLayer = new CanvasMarkerLayer({ collisionFlg: true }).addTo(map)
						// 使用未修改的原始 canvasMarkerLayer 由于不能按照角度旋转，无问题
						// const ciLayer = new CanvasIconLayer({}).addTo(map)
						// @ts-ignore
						// ciLayer.addLayers(markers)
						ciLayer.addMarkers(markers)
						// @ts-ignore
						// ciLayer.anchor()
						// ciLayer.addTo(map)
						this.canvasMarkerLayer = ciLayer
						// TODO:[*] 23-01-13 使用国内替代插件 会出现 marker 无法旋转的问题
						// const ciLayer = new CanvasMarkerLayer({
						// 	collisionFlg: true,
						// }).addTo(map)
						// // 把marker添加到图层
						// ciLayer.addLayers(markers)
						// 方式3 https://github.com/bbecquet/Leaflet.RotatedMarker 也无法将 marker旋转
						// const markersCanvas = new L.MarkersCanvas()
						// markersCanvas.addTo(map)
						// // 把marker添加到图层
						// markersCanvas.addMarkers(markers)
					}
				}
			}
		)
		// return new CanvasLayerMidModel(markers, this.canvasMarkerLayer)
		return this.canvasMarkerLayer
	}

	/**
	 * 根据风速返回对应的风力杆img url
	 *
	 * @private
	 * @param {number} spd
	 * @returns {string}
	 * @memberof WindArrow
	 */
	private getSpdImg(spd: number): string {
		const src = '/static/icons/base_bar/'
		const imgName = 'n_bar.gif'

		return `${src}${imgName}`
	}
}
export { WaveArrow }
