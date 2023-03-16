/**
 * + 22-11-21 根据唯一条件获取对应的台风路径
 */
export const TO_GET_UNIQUE_TY_SEARCH_READ_DATA = 'TO_GET_UNIQUE_TY_SEARCH_READ_DATA'

/**
 * + 22-11-21 根据唯一条件获取对应的台风集合(code,num,name)
 */
export const TO_GET_UNIQUE_TY_SEARCH_LIST = 'TO_GET_UNIQUE_TY_SEARCH_LIST'

/**
 * + 22-11-30 执行过滤并获取匹配的台风路径操作
 */
export const TO_FILTER_TY_PATH_LIST = 'TO_FILTER_TY_PATH_LIST'

/**
 * + 22-11-22 收起复杂配置项 drawer
 */
export const TO_CLOSE_COMPLEX_OPTS_DRAWER = 'TO_CLOSE_COMPLEX_OPTS_DRAWER'

/**
 * + 22-11-23 清除全部图层
 */
export const TO_CLEAR_ALL_LAYER = 'TO_CLEAR_ALL_LAYER'

/**
 * + 22-11-23 清除过滤后的台风列表
 */
export const TO_CLEAR_ALL_FILTER_TYS = 'TO_CLEAR_ALL_FILTER_TYS'

/**
 * + 23-01-05 按照经纬度加载预报时序数据
 * @ params: 
 *  {
       latlng: L.LatLng 经纬度
       layerType: LayerTypeEnum 图层类型
       issueTimestamp: number   发布预报时间戳
      } 
*/
export const TO_LOAD_FORECASTDATALIST_COORDS = 'TO_LOAD_FORECASTDATALIST_COORDS'
