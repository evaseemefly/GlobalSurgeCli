import * as L from 'leaflet'
// map 相关
/** 圈选范围默认半径 */
const DEFAULT_BOX_LOOP_RADIUS = 100
/** 圈选范围默认的单位 DEFAULT_BOX_LOOP_RADIUS*unit */
const DEFAULT_BOX_LOOP_RADIUS_UNIT = 100
/** 圈选默认位置 */
const DEFAULT_BOX_LOOP_LATLNG = new L.LatLng(30, 150)

// 默认的 leaflet layer id
const DEFAULT_LAYER_ID = -1

/**
 * 默认台风编号
 */
const DEFAULT_TY_CODE = 'DEFAULT'

/** 默认未选择的台风名称(ch) */
const DEFAULT_TY_NAME_CH = '未选择'

const DEFAULT_PRODUCT_TYPE_NAME = '未选择'

/** 默认未选择的台风名称(en) */
const DEFAULT_TY_NAME = 'un-select'

const DEFAULT_TY_NUM = '0000'

const DEFAULT_DATE = new Date(1970, 1, 1)

const DEFAULT_TIMESTAMP = 0

const DEFAULT_TIMESTAMP_STR = '000000'

/** 默认海洋站 code */
const DEFAULT_STATION_CODE = 'DEFAULT_CODE'
/** 默认海洋站 name */
const DEFAULT_STATION_NAME = 'DEFAULT_NAME'

/** 不存在的站点名 */
const NONE_STATION_NAME = 'None'

/** 默认时间间隔(对应时间组件——由当前台风的时间间隔决定) */
const DEFAULT_DATE_STEP = 1

/** 潮位 table 中的 td 之间的时间间隔(h) */
const DEFAULT_SURGE_TD_STEP = 1

/** 查询的起止时间间隔(单位:s) */
const DEFAULT_TIME_SPAN = 60 * 60 * 24

/** 温带预报系统的起止时间间隔(单位:s) */
const DEFAULT_WD_TIME_SPAN = 60 * 60 * 24 * 7

/** 温带起止时间间隔(单位:s)——温带预报为七天 */
const DEFAULT_TIME_SPAN_WD = 60 * 60 * 7

/** 圆的半径的单位系数 @type {*} */
const DEFAULT_ALERT_TIDE = -999999
/** 默认基面差值 @type {*} */
const DEFAULT_SURGE_DIFF = -999999

/** 潮位不存在的默认值 与后台对应 */
const DEFAULT_SURGE_VAL = -9999.99

/** 所有观测值的默认值 */
const DEFAULT_VAL = -9999

// 对应 db: dict_base -> 默认的 code
const DEFAULT_DICT_KEY = -1

/** 用于 复杂唯一性查询 的 year 与 month 的默认值 */
const DEFAULT_COMPLEX_NUM = -1

export {
	DEFAULT_BOX_LOOP_RADIUS,
	DEFAULT_BOX_LOOP_RADIUS_UNIT,
	DEFAULT_BOX_LOOP_LATLNG,
	DEFAULT_LAYER_ID,
	DEFAULT_DATE,
	DEFAULT_TY_CODE,
	DEFAULT_TY_NAME_CH,
	DEFAULT_TY_NAME,
	DEFAULT_TY_NUM,
	DEFAULT_DATE_STEP,
	DEFAULT_STATION_CODE,
	DEFAULT_STATION_NAME,
	DEFAULT_SURGE_DIFF,
	DEFAULT_ALERT_TIDE,
	DEFAULT_SURGE_VAL,
	DEFAULT_COMPLEX_NUM,
	DEFAULT_TIMESTAMP,
	DEFAULT_TIMESTAMP_STR,
	DEFAULT_PRODUCT_TYPE_NAME,
	DEFAULT_SURGE_TD_STEP,
	DEFAULT_TIME_SPAN,
	DEFAULT_DICT_KEY,
	DEFAULT_TIME_SPAN_WD,
	NONE_STATION_NAME,
	DEFAULT_WD_TIME_SPAN,
	DEFAULT_VAL,
}
