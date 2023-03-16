import moment from 'moment'

import { DEFAULT_DATE, DEFAULT_PRODUCT_TYPE_NAME, DEFAULT_SURGE_VAL } from '@/const/default'
import { TyphoonLevelEnum } from '@/enum/typhoon'
import { LayerTypeEnum } from '@/enum/map'
import chroma from 'chroma-js'
/**
 * 将时间转换为指定的格式(str)
 *
 * @param {Date} now
 * @returns {string}
 */
const fortmatData2YMDHM = (now: Date): string => {
	if (now === DEFAULT_DATE) {
		return '-'
	} else {
		return moment(now).format('YYYY-MM-DD HH:mm')
	}
}
const fortmatData2MDHM = (now: Date | number): string => {
	return moment(now).format('MM-DD HH:mm')
}
const formatData2YMDH = (now: Date): string => {
	return moment(now).format('YYYY-MM-DD HH')
}
const formatDate2YMD = (now: Date): string => {
	return moment(now).format('YYYY-MM-DD')
}

const formatDate2MD = (now: Date): string => {
	return moment(now).format('MM-DD')
}

const formatDate2HM = (now: Date): string => {
	return moment(now).format('HH:mm')
}
const fortmatDate = (now: Date, formatStr: string) => {
	if (now === DEFAULT_DATE) {
		return '-'
	}
	return moment(now).format(formatStr)
}

const formatOnlyFirstCol = (val: { name: string; key: number }): string => {
	return val.key === 0 ? val.name : '-'
}

/**
 * @description val左侧填充' ' 至 length=len
 * @author evaseemefly
 * @date 2022/09/16
 * @param {string} val
 * @param {number} len
 * @returns {*}  {string}
 */
const formatPadLeftStr = (val: string, len: number): string => {
	return val.padStart(len)
}

/**
 * @description val 右侧填充 ' ' 至 Length = len
 * @author evaseemefly
 * @date 2022/09/16
 * @param {string} val
 * @param {number} len
 * @returns {*}  {string}
 */
const formatPadRightstr = (val: string, len: number): string => {
	return val.padEnd(len)
}

/**
 * @description 台风级别 enum => str
 * @author evaseemefly
 * @date 2022/09/28
 * @param {TyphoonLevelEnum} val
 * @returns {*}  {string}
 */
const formatTyLevel2Str = (val: string): string => {
	let tyName = ''
	switch (val) {
		// case TyphoonLevelEnum.TS:
		// 	tyName = '热带风暴'
		// 	break
		// case TyphoonLevelEnum.STS:
		// 	tyName = '强热带风暴'
		// 	break
		// case TyphoonLevelEnum.TY:
		// 	tyName = '台风'
		// 	break
		// case TyphoonLevelEnum.STY:
		// 	tyName = '强台风'
		// 	break
		// case TyphoonLevelEnum.SUPERTY:
		// 	tyName = '超强台风'
		// 	break
		case 'TS':
			tyName = '热带风暴'
			break
		case 'STS':
			tyName = '强热带风暴'
			break
		case 'TY':
			tyName = '台风'
			break
		case 'STY':
			tyName = '强台风'
			break
		case 'SuperTY':
			tyName = '超强台风'
			break

		default:
			tyName = '其他'
			break
	}
	return tyName
}

/**
 * @description 根据台风级别获取对应的 class
 * @author evaseemefly
 * @date 2022/09/28
 * @param {TyphoonLevelEnum} val
 * @returns {*}  {string}
 */
const formatTyLevel2Cls = (val: string): string => {
	let tyName = ''
	switch (val) {
		// case TyphoonLevelEnum.TS:
		// 	tyName = 'green'
		// 	break
		// case TyphoonLevelEnum.STS:
		// 	tyName = 'blue'
		// 	break
		// case TyphoonLevelEnum.TY:
		// 	tyName = 'yellow'
		// 	break
		// case TyphoonLevelEnum.STY:
		// 	tyName = 'orange'
		// 	break
		// case TyphoonLevelEnum.SUPERTY:
		// 	tyName = 'red'
		// 	break
		case 'TS':
			tyName = 'green'
			break
		case 'STS':
			tyName = 'blue'
			break
		case 'TY':
			tyName = 'yellow'
			break
		case 'STY':
			tyName = 'orange'
			break
		case 'SuperTY':
			tyName = 'red'
			break
		default:
			tyName = 'other'
			break
	}
	return tyName
}

/**
 * @description 根据 surge 数值获取对应的 color str
 * 此处标准与 middle_model/station.ts -> IconFormStationDetialedMidModel.getAlarmColor 一致
 * @author evaseemefly
 * @date 2022/10/30
 * @param {number} val
 * @returns {*}  {string}
 */
const filterSurgeAlarmColor = (val: number): string => {
	const surge = val
	let colorStr = ''
	switch (true) {
		case surge <= 100:
			colorStr = 'green'
			break
		case surge <= 150:
			colorStr = 'blue'
			break
		case surge <= 200:
			colorStr = 'yellow'
			break
		case surge <= 250:
			colorStr = 'orange'
			break
		case surge > 250:
			colorStr = 'red'
			break
		default:
			break
	}
	return colorStr
}

const waveScale = chroma
	.scale('#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F')
	.domain([2, 3, 4, 6, 9, 12, 14])
/**
 * @description 根据输入的浪高获取对应的颜色
 * @author evaseemefly
 * @date 2023/02/09
 * @param {number} val
 * @returns {*}  {string}
 */
const filterWaveColor = (val: number): string => {
	// chroma.scale(['yellow', 'lightgreen', '008ae5']).domain([0, 0.25, 1])
	const scale = chroma
		.scale(['#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F'])
		.domain([0, 3, 4, 6, 9, 12, 14])
	const colorStr = scale(val).hex()
	return colorStr
}

/**
 * @description 根据字典获取对应的海洋站中文名
 * @author evaseemefly
 * @date 2022/11/09
 * @param {string} code
 * @param {{ name: string; chname: string }[]} [nameDict=[]]
 * @returns {*}  {string}
 */
const filterStationNameCh = (
	code: string,
	nameDict: { name: string; chname: string }[] = []
): string => {
	/** 当前站点英文名 */
	const stationNameEn = code
	const queryName = nameDict.find((temp) => {
		return temp.name === stationNameEn
	})

	/** 当前站点中文名 */
	const stationNameCh = queryName !== undefined ? queryName.chname : stationNameEn
	return stationNameCh
}

/**
 * @description 根据传入的实况增水若<=0则说明最大的增水仍为减水，则返回-;否则 tostring
 * @author evaseemefly
 * @date 2022/12/06
 * @param {number} val
 * @returns {*}  {string}
 */
const filterStationAlertTideVal = (val: number): string => {
	if (val > 0) {
		return val.toString()
	} else {
		return '-'
	}
}

/**
 * 获取产品种类名称
 * @param productType 产品种类枚举
 * @returns 产品对应的名称
 */
const filterProductTypeName = (productType: LayerTypeEnum): string => {
	let productTypeName: string = DEFAULT_PRODUCT_TYPE_NAME
	switch (productType) {
		case LayerTypeEnum.RASTER_LAYER_MWD:
			productTypeName = '平均波向'
			break
		case LayerTypeEnum.RASTER_LAYER_MWP:
			productTypeName = '平均波周期'
			break
		case LayerTypeEnum.RASTER_LAYER_SHWW:
			productTypeName = '风浪波高'
			break
		case LayerTypeEnum.RASTER_LAYER_WVE:
			productTypeName = '有效波高'
			break
		default:
			productTypeName = DEFAULT_PRODUCT_TYPE_NAME
			break
	}
	return productTypeName
}

/**
 * 根据经纬度获取经纬度字符串
 * 保留 saveSpliceNum 有效数字
 * @param latlng
 * @returns
 */
const filterLatlng2Str = (latlng: L.LatLng | undefined): string => {
	let latlngStr = '-'
	/** 需要保留有效数字的位数 */
	const saveSpliceNum = 2
	if (latlng !== undefined) {
		latlngStr = `${latlng.lat.toFixed(saveSpliceNum)}, ${latlng.lng.toFixed(saveSpliceNum)}`
	}

	return latlngStr
}

/**
 * @description 对方向取整
 * @author evaseemefly
 * @date 2023/02/08
 * @param {number} val
 * @returns {*}  {string}
 */
const formatDir2Int = (val: number): string => {
	const dirInt = Math.trunc(val)
	return dirInt.toString()
}

/**
 * @description 将输入的 surge 值转换为 str . 若输入的为 DEFAULT_SURGE_VAL 则输出 -
 * @author evaseemefly
 * @date 2023/02/07
 * @param {number} val
 * @returns {*}  {string}
 */
const formatSurge2Str = (val: number): string => {
	let surgeStr = val.toString()
	if (val === DEFAULT_SURGE_VAL) {
		surgeStr = '-'
	}
	return surgeStr
}

/**
 * @description 将输入的surge保留2为有效数字
 * @author evaseemefly
 * @date 2023/02/08
 * @param {number} val
 * @returns {*}  {string}
 */
const formatSurgeFixed2Str = (val: number): string => {
	const surgeStr = val.toFixed(2)
	return surgeStr
}

export {
	fortmatData2YMDHM,
	formatOnlyFirstCol,
	formatPadLeftStr,
	formatPadRightstr,
	formatDate2YMD,
	formatDate2MD,
	formatDate2HM,
	formatTyLevel2Str,
	formatTyLevel2Cls,
	fortmatData2MDHM,
	filterSurgeAlarmColor,
	filterStationNameCh,
	filterStationAlertTideVal,
	filterProductTypeName,
	filterLatlng2Str,
	formatSurge2Str,
	formatDir2Int,
	formatSurgeFixed2Str,
	filterWaveColor,
}
