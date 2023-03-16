// 本插件来自 http://eJuke.github.io/Leaflet.Canvas-Markers

/*
RBush是用于点和矩形的2D 空间索引的高性能JavaScript库。
它基于具有批量插入支持的优化R树数据结构。
空间索引是用于点和矩形的特殊数据结构，它使您可以高效地执行查询，例如“边界框内的所有项目”（例如，比遍历所有项目快数百倍）。
它最常用于地图和数据可视化中。
 git地址:https://github.com/mourner/rbush
*/

// @ts-ignore
import Rbush from 'rbush'
// 尝试引入 leaflet
import * as L from 'leaflet'
/* global L */

const CanvasMarkerLayer = (L.Layer ? L.Layer : L.Class).extend({
	options: {
		zIndex: null, //图层dom元素的堆叠顺序
		collisionFlg: false, //碰撞检测
		moveReset: false, //在move时是否刷新地图
		opacity: 1, //图层透明度
	},
	// Add event listeners to initialized section.
	initialize: function (options) {
		L.setOptions(this, options)
		this._onClickListeners = []
		this._onHoverListeners = []
		/**
		 * 在地图当前范围内的marker的集合
		 * @type {rbush<MarkerData>}
		 */
		this._containMarkers = new Rbush()
		/**
		 * 当前显示在地图上的marker的集合
		 * TODO:[*] 23-01-16 注意此处应将 _latlngMarkers 修改为 _showMarkers
		 * @type {rbush<MarkerData>}
		 */
		this._showMarkers = new Rbush()

		/**
		 * 当前显示在地图上的marker的范围集合
		 * @type {rbush<MarkerBoundsData>}
		 */
		this._showMarkerBounds = new Rbush()
	},

	setOptions: function (options) {
		L.setOptions(this, options)
		return this.redraw()
	},

	/**
	 * 重新绘制
	 */
	redraw: function () {
		this._redraw(true)
	},

	// Multiple layers at a time for rBush performance
	addMarkers: function (markers) {
		const self = this
		const tmpMark = []
		const tmpLatLng = []

		markers.forEach(function (marker) {
			if (!(marker.options.pane === 'markerPane' && marker.options.icon)) {
				console.error("Layer isn't a marker")
				return
			}

			const latlng = marker.getLatLng()
			// TypeError: Cannot read property 'getBounds' of undefined
			const isDisplaying = self._map.getBounds().contains(latlng)
			const s = self._addMarker(marker, latlng, isDisplaying)

			// Only add to Point Lookup if we are on map
			if (isDisplaying === true) {
				tmpMark.push(s[0])
			}

			tmpLatLng.push(s[1])
		})
		// TODO:[*] 20-11-08 + 执行以下 this._context.restore 方法
		// 去掉，无用
		// if (this._context) {
		//     this._context.restore()
		// }
		// TODO:[-] 21-03-26 注意 self._markser 有可能是未定义
		if ('_markers' in self) {
			self._markers.load(tmpMark)
			self._latlngMarkers.load(tmpLatLng)
		}
		// TODO:[-] 23-01-14 注意一定要在批量添加marker之后手动执行 reset 操作，否则不会立刻显示canvas图层
		// 无效
		// self._reset()
	},

	// Adds single layer at a time. Less efficient for rBush
	addMarker: function (marker) {
		const self = this
		const latlng = marker.getLatLng()
		const isDisplaying = self._map.getBounds().contains(latlng)
		const dat = self._addMarker(marker, latlng, isDisplaying)

		// Only add to Point Lookup if we are on map
		if (isDisplaying === true) self._markers.insert(dat[0])

		self._latlngMarkers.insert(dat[1])
	},

	addLayer: function (layer) {
		if (layer.options.pane === 'markerPane' && layer.options.icon) this.addMarker(layer)
		else console.error("Layer isn't a marker")
	},

	addLayers: function (layers) {
		this.addMarkers(layers)
	},

	removeLayer: function (layer) {
		this.removeMarker(layer, true)
	},

	removeMarker: function (marker, redraw) {
		const self = this

		// If we are removed point
		if (marker['minX']) marker = marker.data

		const latlng = marker.getLatLng()
		const isDisplaying = self._map.getBounds().contains(latlng)

		const markerData = {
			minX: latlng.lng,
			minY: latlng.lat,
			maxX: latlng.lng,
			maxY: latlng.lat,
			data: marker,
		}

		self._latlngMarkers.remove(markerData, function (a, b) {
			return a.data._leaflet_id === b.data._leaflet_id
		})

		self._latlngMarkers.total--
		self._latlngMarkers.dirty++

		if (isDisplaying === true && redraw === true) {
			self._redraw(true)
		}
	},

	onAdd: function (map) {
		this._map = map

		if (!this._canvas) this._initCanvas()

		if (this.options.pane) this.getPane().appendChild(this._canvas)
		else map._panes.overlayPane.appendChild(this._canvas)
		map.on('load', this._reset, this)
		map.on('moveend', this._reset, this)
		map.on('resize', this._reset, this)

		map.on('click', this._executeListeners, this)
		map.on('mousemove', this._executeListeners, this)
	},

	onRemove: function (map) {
		if (this.options.pane) this.getPane().removeChild(this._canvas)
		else map.getPanes().overlayPane.removeChild(this._canvas)

		map.off('click', this._executeListeners, this)
		map.off('mousemove', this._executeListeners, this)

		map.off('moveend', this._reset, this)
		map.off('resize', this._reset, this)
	},

	/**
	 *  重新锚定
	 * ———— 此种方式无效
	 */
	anchor: function () {
		this._reset()
	},

	addTo: function (map) {
		map.addLayer(this)
		return this
	},

	clearLayers: function () {
		this._latlngMarkers = null
		this._markers = null
		// TypeError: Cannot read properties of null (reading 'clear')
		// this._markers.clear()

		this._showMarkers = new Rbush()
		this._showMarkerBounds = new Rbush()
		this._containMarkers.clear()
		this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
		this._removeCanvasByDom()
		this._containMarkers = new Rbush()

		// this._redraw(true)
	},

	_removeCanvasByDom: function (): void {
		const targetDom = document.getElementsByClassName('leaflet-canvas-icon-layer leaflet-layer')
		if (targetDom.length > 0) {
			targetDom[0].remove()
		}
	},

	_addMarker: function (marker, latlng, isDisplaying) {
		const self = this
		// Needed for pop-up & tooltip to work.
		marker._map = self._map

		// _markers contains Points of markers currently displaying on map
		// 相当于创建了一个 矩形
		// TODO:[*] 20-11-08 Rbush 是干什么用的
		if (!self._markers) self._markers = new Rbush()

		// _latlngMarkers contains Lat\Long coordinates of all markers in layer.
		if (!self._latlngMarkers) {
			self._latlngMarkers = new Rbush()
			self._latlngMarkers.dirty = 0
			self._latlngMarkers.total = 0
		}

		L.Util.stamp(marker)

		const pointPos = self._map.latLngToContainerPoint(latlng)
		// [20, 18]
		const iconSize = marker.options.icon.options.iconSize

		const adjX = iconSize[0] / 2
		const adjY = iconSize[1] / 2
		const ret = [
			{
				minX: pointPos.x - adjX,
				minY: pointPos.y - adjY,
				maxX: pointPos.x + adjX,
				maxY: pointPos.y + adjY,
				data: marker,
			},
			{
				minX: latlng.lng,
				minY: latlng.lat,
				maxX: latlng.lng,
				maxY: latlng.lat,
				data: marker,
			},
		]

		self._latlngMarkers.dirty++
		self._latlngMarkers.total++

		// Only draw if we are on map
		if (isDisplaying === true) self._drawMarker(marker, pointPos)

		return ret
	},

	/**
	 * 绘制图标
	 * @param marker 图标
	 * @param pointPos 图标中心点在屏幕上的像素位置
	 * @returns
	 */
	_drawMarker: function (marker, pointPos) {
		const self = this
		//创建图标缓存
		if (!this._imageLookup) this._imageLookup = {}
		//没有传入像素位置,则计算marker自身的位置
		if (!pointPos) {
			pointPos = self._map.latLngToContainerPoint(marker.getLatLng())
		}

		// 注意此处支持用户自定义 一个绘制的 func 在 this.options.userDrawFunc 中定义
		if (this.options.userDrawFunc && typeof this.options.userDrawFunc === 'function') {
			const size = marker.options.icon.options.iconSize
			this.options.userDrawFunc(this, marker, pointPos, size)
		} else {
			// TODO:[-] 23-01-16 加入碰撞检测
			const options = marker.options.icon.options
			const minX = pointPos.x - options.iconAnchor[0]
			const maxX = minX + options.iconSize[0]
			const minY = pointPos.y - options.iconAnchor[1]
			const maxY = minY + options.iconSize[1]

			const markerBounds = {
				minX,
				minY,
				maxX,
				maxY,
			}
			if (this.options.collisionFlg == true) {
				// 判定 给定markerBounds的边界与 this._showMarkerBounds 中的任何项有相交
				if (this._showMarkerBounds.collides(markerBounds)) {
					return
				} else {
					// 若均未与 this._showMarkerBounds 中的任何项有相交则插入当前项 markerBounds
					this._showMarkerBounds.insert(markerBounds)
					const latlng = marker.getLatLng()
					// 插入当前项 markerBounds 对应的 marker
					this._showMarkers.insert({
						minX,
						minY,
						maxX,
						maxY,
						lng: latlng.lng,
						lat: latlng.lat,
						data: marker,
					})
				}
			}
			//
			self._drawIcon(marker, pointPos)
		}
	},

	// 绘制 icon 的方法
	_drawIcon: function (marker, pointPos) {
		const self = this
		const iconUrl = marker.options.icon.options.iconUrl

		if (marker.canvas_img) {
			self._drawImage(marker, pointPos)
		} else {
			if (self._imageLookup[iconUrl]) {
				// TODO: 此处无法处理传入的类型为: L.divIcon
				marker.canvas_img = self._imageLookup[iconUrl][0]

				if (self._imageLookup[iconUrl][1] === false) {
					self._imageLookup[iconUrl][2].push([marker, pointPos])
				} else {
					self._drawImage(marker, pointPos)
				}
			} else {
				// TODO: 此处创建了一个 Image 标签对象
				// 需要在其中定义style的话可以在此处进行
				// 创建了一个 HTMLImageElement 对象
				const i = new window.Image()
				// "/static/windbaricon/level5.png"
				i.src = iconUrl
				marker.canvas_img = i

				// Image,isLoaded,marker\pointPos ref
				self._imageLookup[iconUrl] = [i, false, [[marker, pointPos]]]

				i.onload = function () {
					self._imageLookup[iconUrl][1] = true
					self._imageLookup[iconUrl][2].forEach(function (e) {
						self._drawImage(e[0], e[1])
					})
				}
			}
		}
	},

	// TODO: 此处有修改
	// 绘制具体的图形
	_drawImage: function (marker, pointPos) {
		const self = this
		const options = marker.options.icon.options
		// TODO: 20-09-17 新的修改
		// 注意实践后的流程是:
		/*
            1- context.save()
            2- 获取 marker.options['rotationAngle']
            3- 对角度进行转换 -> rotaAngle
            4- 平移 x,y - 图标的半径x,y/2
            5- 对于 context 进行旋转(rotaAngle)
            6- 上下文对象 .drwaImage 绘图
        */
		// const angle = marker.options.rotationAngle
		// TODO:[*] 23-01-14 此处加入是否存在角度的判断
		if (marker.options['rotationAngle'] !== undefined) {
			const angle = marker.options['rotationAngle']
			this._context.save()
			const rotaAngle = angle * (Math.PI / 180)
			this._context.translate(
				pointPos.x - options.iconAnchor[0] / 2,
				pointPos.y - options.iconAnchor[1] / 2
			)
			this._context.rotate(rotaAngle)
			this._context.drawImage(
				marker.canvas_img,
				// 注意此处不需要修改该 img 的距离 定点的位置，而是直接移动
				-options.iconSize[0] / 2,
				-options.iconSize[1] / 2,
				options.iconSize[0],
				options.iconSize[1]
			)
			this._context.restore()
		} else {
			// 若传入的不含 rotationAngle 则不需要进行旋转
			this._context.drawImage(
				marker.canvas_img,
				pointPos.x - options.iconAnchor[0],
				pointPos.y - options.iconAnchor[1],
				options.iconSize[0],
				options.iconSize[1]
			)
		}

		// 注意此处加入了一个判断，因为对该库进行了改造
		// if (angle != null) {
		// } else {
		// 	console.error('marker.otpions -> not contain "rotationAngle"!')
		// }
		// TODO:[x] 20-11-08 此处在跳出 方法时执行以下 this._context.restore 方法
		// 经测试无效，去掉
		// this._context.restore()
	},

	// 根据传入的 canvas 上下文对象将 canvas -> png 并返回
	_convertCanvasToImage: function (tempCtx) {
		const image = new Image()
		// 出现错误: Uncaught DOMException: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
		// 参考:https://www.jianshu.com/p/6fe06667b748
		image.src = tempCtx.canvas.toDataURL('image/png')
		return image
	},

	_reset: function () {
		const topLeft = this._map.containerPointToLayerPoint([0, 0])
		L.DomUtil.setPosition(this._canvas, topLeft)

		const size = this._map.getSize()

		this._canvas.width = size.x
		this._canvas.height = size.y

		this._redraw()
	},

	/**
	 * 重新绘制
	 * @param clear 是否清空
	 * @returns
	 */
	_redraw: function (is2clear) {
		this._showMarkerBounds = new Rbush()
		this._showMarkers = new Rbush()
		const self = this
		//清空画布
		if (is2clear) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
		if (!this._map || !this._latlngMarkers) return

		let tmp = []

		//如果单个插入/删除的数量超过总数的10%,则重建查找以提高效率
		if (self._latlngMarkers.dirty / self._latlngMarkers.total >= 0.1) {
			self._latlngMarkers.all().forEach(function (e) {
				tmp.push(e)
			})

			self._latlngMarkers.clear()
			self._latlngMarkers.load(tmp)
			self._latlngMarkers.dirty = 0
			tmp = []
		}
		//地图地理坐标边界
		/*
		LatLngBounds {_southWest: LatLng, _northEast: LatLng}
						_northEast: LatLng {lat: 40.81397319630423, lng: 160.79589923449922}
						_southWest: LatLng {lat: 7.624101584127662, lng: 91.5820320469992}
		*/

		const mapBounds = self._map.getBounds()

		/**
		 * {minX: 91.5820320469992, minY: 7.624101584127662, maxX: 160.79589923449922, maxY: 40.81397319630423}
		 */
		//适用于runsh的边界对象
		const mapBoxCoords = {
			minX: mapBounds.getWest(),
			minY: mapBounds.getSouth(),
			maxX: mapBounds.getEast(),
			maxY: mapBounds.getNorth(),
		}

		// 查询范围内的图标
		// 返回给定边界框相交的数据项（点或矩形）数组。
		self._latlngMarkers.search(mapBoxCoords).forEach(function (e) {
			//图标屏幕坐标
			// Point{x: 1442.9999818638407, y: 195.00492990338748}
			const pointPos = self._map.latLngToContainerPoint(e.data.getLatLng())
			// [20, 18]
			const iconSize = e.data.options.icon.options.iconSize
			const adjX = iconSize[0] / 2
			const adjY = iconSize[1] / 2

			const newCoords = {
				minX: pointPos.x - adjX,
				minY: pointPos.y - adjY,
				maxX: pointPos.x + adjX,
				maxY: pointPos.y + adjY,
				data: e.data,
			}

			tmp.push(newCoords)

			// Redraw points
			// TODO:[*] 23-01-16 加入了碰撞检测的逻辑将此处代码移至外侧
			self._drawMarker(e.data, pointPos)
		})

		// Clear rBush & Bulk Load for performance
		this._markers.clear()
		this._markers.load(tmp)
		this._containMarkers.clear()
		this._containMarkers.load(tmp)
		if (this.options.collisionFlg != true) {
			this._showMarkers = this._containMarkers
		}
		return this
	},

	// TODO: 此处有不同
	// 初始化 canvas 画布，主要是创建一个 2d 的 canvas 上下文对象(CanvasRenderingContext2D)
	_initCanvas: function () {
		this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-icon-layer leaflet-layer')
		const originProp = L.DomUtil.testProp([
			'transformOrigin',
			'WebkitTransformOrigin',
			'msTransformOrigin',
		])
		// @ts-ignore
		this._canvas.style[originProp] = '50% 50%'
		// TODO[-] 20-11-09 参考 this._reset 中设置 距离 原点(左上原点) 的位移量
		const topLeft = this._map.containerPointToLayerPoint([0, 0])
		L.DomUtil.setPosition(this._canvas, topLeft)
		// ----
		const size = this._map.getSize()
		this._canvas.width = size.x
		this._canvas.height = size.y

		this._context = this._canvas.getContext('2d')

		const animated = this._map.options.zoomAnimation && L.Browser.any3d
		L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'))
	},

	addOnClickListener: function (listener) {
		this._onClickListeners.push(listener)
	},

	addOnHoverListener: function (listener) {
		this._onHoverListeners.push(listener)
	},

	_executeListeners: function (event) {
		if (!this._markers) return

		const me = this
		const x = event.containerPoint.x
		const y = event.containerPoint.y

		if (me._openToolTip) {
			me._openToolTip.closeTooltip()
			delete me._openToolTip
		}

		const ret = this._markers.search({ minX: x, minY: y, maxX: x, maxY: y })

		if (ret && ret.length > 0) {
			me._map._container.style.cursor = 'pointer'

			if (event.type === 'click') {
				const hasPopup = ret[0].data.getPopup()
				if (hasPopup) ret[0].data.openPopup()

				me._onClickListeners.forEach(function (listener) {
					listener(event, ret)
				})
			}

			if (event.type === 'mousemove') {
				const hasTooltip = ret[0].data.getTooltip()
				if (hasTooltip) {
					me._openToolTip = ret[0].data
					ret[0].data.openTooltip()
				}

				me._onHoverListeners.forEach(function (listener) {
					listener(event, ret)
				})
			}
		} else {
			me._map._container.style.cursor = ''
		}
	},
})

// @ts-ignore
L.canvasMarkerLayer = function (options) {
	// @ts-ignore
	return new CanvasMarkerLayer(options)
}

// 20-09-21 可以使用es6的方式将自定义的 CanvasMarkerLayer 导出，也可以使用上面的的方式进行实例化，主要需要考虑一下如何获取 options
export { CanvasMarkerLayer }
