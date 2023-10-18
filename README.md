# GlobalSurgeCli

全球潮位数据展示系统-前端项目  
采用自研`ocean flow`海洋数据显示框架

-   23-09-05 最新的功能说明详见 [功能说明](./主要功能介绍.md)

#### 技术实现

全球化潮位系统基于爬虫框架`scrapy`及分布式作业框架`schedule`，实现分布式爬虫系统;  
基于前后端分离技术，尝试采用基于`starlette`与`pydantic`的`fastapi`框架提供数据发布服务;  
尝试将`Vue`与`Leaflet`相融合，实现基于 WebGIS 的组件化前端系统实现.

#### 功能实现

本平台可以实现自动实时爬取全球共享潮位站数据，提供全球潮位站的天文潮潮位数据检索、查询、显示功能。自动生成展示全球不同区域风暴潮预警报产品。后台服务提供通用的调用接口。

#### 后端实现

本系统后端采用 fastapi+sqlalchemy2.0 ,详见[后端工程](https://github.com/evaseemefly/GlobalSurgeSys)
![fastapi](./public/static/icons/fastapi/fastapi-tutorial.png)

开源不易，若有引用请注明[出处](https://github.com/evaseemefly/GlobalSurgeCli)，谢谢！

---

### 版本预览

##### v0.1

地图页面
![v0.1](./docs/imgs/001.png)  
地图页面可切换
![v0.1](./docs/imgs/002.png)  
加载指定站点指定时间段内(当前选定时间 - 24h)的历史潮位数据
![v0.1](./docs/imgs/003.png)  
![v0.1](./docs/imgs/004.png)

爬取的全球的潮位(计算了天文潮位的站点)
![v0.1](./docs/imgs/005.png)  
![v0.1](./docs/imgs/006.png)
叠加显示天文潮位的站点详情
![v0.1](./docs/imgs/007.png)

23-04-11 update 潮位 form 中的 chart 中的 tooltip 格式以及修改了 surgeTable 中的部分 bug;修改 surge 与 tide 不再向下填充,增水向下填充
![v0.1](./docs/imgs/008.png)

23-04-12 update 修改了潮位`form`的`chart`的布局与样式
![v0.2](./docs/imgs/009.png)

---

23-04-13 - 14 加入了起止时间间隔，以及根据起止时间间隔动态计算数据间隔(1,2,3H)  
![v0.2](./docs/imgs/010.png)  
![v0.2](./docs/imgs/011.png)  
![v0.2](./docs/imgs/012.png)

23-04-19 新加入了按照国家及地区统计的功能，在地图上加载指定地区及国家的所属站位
![v0.3](./docs/imgs/014.png)  
![v0.3](./docs/imgs/015.png)

23-04-20 潮位站 icon 会根据最后更新时间以不同颜色区分显示;点击某个国家或区域，快速定位到指定区域;修复了其他 bug
![v0.3](./docs/imgs/016.png)

23-04-21 form 均加入了过渡效果

---

-   23-06-08
    基于全球潮位系将温带风暴潮业务融入该系统
    部分原型手稿:
    ![v0.23](./docs/imgs/023.png)  
    ![v0.24](./docs/imgs/024.png)
    ![v0.25](./docs/imgs/025.png)

---

以栅格图层的形式加载指定发布时间发布的最大增水场图层(以 geotif 的方式)
![v0.18](./docs/imgs/018.png)  
以等值面的方式加载最大增水场图层
![v0.19](./docs/imgs/019.png)  
加载 7 日内的最大增水及总潮位极值列表
![v0.20](./docs/imgs/020.png)  
详情
![v0.21](./docs/imgs/021.png)

-   23-08-22 由于修改了时效为 7d 出现了加载 form 会溢出的问题
    ![v0.22](./docs/imgs/022.png)
-   23-08-25 修复了部分 bug,加入了加载站点 form 中的站点基础信息
    ![v0.26](./docs/imgs/026.png)  
    ![v0.27](./docs/imgs/027.png)

---

-   23-09-01 加入了按照时间轴位移增水的功能
    原始增水
    ![v0.28](./docs/imgs/028.png)  
     位移后的增水
    ![v0.29](./docs/imgs/029.png)

---

-   23-10-16 加入了根据当前站点加载风场对应经纬度的点的时序预报
-   加入了 风速(ws) 与 风向(wd)
* 目前显示逻辑为 显示时间间隔7小时内的总潮位极值与七小时内风场的极值及出现时间
![v0.30](./docs/imgs/030.png)
后续可修改为 显示时间间隔(默认:7小时)内的`总潮位极值`及对应 `天文潮`, `增水`, `风速` 以及`风向`的情况

- 23-10-16 显示全部时间，加入了水平的滚动条
![v0.31](./docs/imgs/031.png)

- 23-10-18 针对风场频繁出现缺失的情况，加入了 `-` 代表预报空缺
![v0.32](./docs/imgs/032.png)