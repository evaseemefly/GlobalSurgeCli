import * as L from 'leaflet'
import { Component, Vue, Watch } from 'vue-property-decorator'
// 20-08-11 wms 相关的中间 model
import { WMSOptionsMidModel, WMSMidModel } from '@/middle_model/geo'
import { baseUrl } from '@/api/common'

/**
 * + 21-01-27 作为 mixin 的 wms常量
 *
 * @class WMSMixin
 * @extends {Vue}
 */
@Component
class WMSMixin extends Vue {
	baseUrl = baseUrl
	// mixin definition here
	landWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_current/wms?`,
		new WMSOptionsMidModel('nmefc_current:land_china')
	)
	ninelineWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_current/wms?`,
		new WMSOptionsMidModel('nmefc_current:9line')
	)
	southlandWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_current/wms?`,
		new WMSOptionsMidModel('nmefc_current:southsea_land')
	)

	// TODO:[-] 20-07-31 新加入的台湾区域的land 多边形 现改为 china
	landTwPoygonsWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_common/wms?`,
		new WMSOptionsMidModel('nmefc_common:new_china_land', 1500)
	)

	// TODO:[-] 20-08-26 新加入的全球国境线
	worldLineWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_common/wms?`,
		new WMSOptionsMidModel('nmefc_common:world_map_line', 1500)
	)

	// TODO:[-] 22-03-29 风暴潮南海区预报范围多边形
	surgeForecastAreaSouthWMS: WMSMidModel = new WMSMidModel(
		`${this.baseUrl}/geoserver/nmefc_common/wms?`,
		new WMSOptionsMidModel('nmefc_common:surge_area_south_polygon')
	)
	url =
		'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
	// leaflet 右下角的文字显示
	attribution =
		'powered by Ocean Flow © 2025 authors: <a href="https://github.com/evaseemefly">evaseemefly</a> | v5.0:25-04-11 融合全球风暴潮模式+实况观测 | nmefc '
}
export { WMSMixin }
