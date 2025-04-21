// 与地图操作相关的公开库
import { ForecastAreaEnum } from '@/enum/map'
import { DEFAULT_LATLNG } from '@/const/default'
import { LatLng } from 'leaflet'

/**
 * 根据预报区域获取预报区域的中心位置
 * @param val 预报区域
 * @returns 中心位置经纬度坐标
 */
const getBoundsByArea = (val: ForecastAreaEnum): LatLng => {
	let center: LatLng = DEFAULT_LATLNG
	switch (val) {
		case ForecastAreaEnum.AMERICA:
			center = new LatLng(29.034, -95.399)
			break
		case ForecastAreaEnum.INDIA_OCEAN:
			center = new LatLng(11.836, 98.536)
			break
		case ForecastAreaEnum.OCEANIA:
			center = new LatLng(-30.956, 154.278)
			break
		case ForecastAreaEnum.WNP:
			center = new LatLng(25.896, 133.2867)
			break
		default:
			center = DEFAULT_LATLNG
			break
	}
	return center
}

export { getBoundsByArea }
