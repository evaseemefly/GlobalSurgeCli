# GlobalSurgeCli
全球潮位数据展示系统-前端项目  
采用自研`ocean flow`海洋数据显示框架  
![oceanflow](./public/static/icons/ocean_flow/of_earth_bold.png)  

#### 技术实现
 全球化潮位系统基于爬虫框架`scrapy`及分布式作业框架`schedule`，实现分布式爬虫系统;  
基于前后端分离技术，尝试采用基于`starlette`与`pydantic`的`fastapi`框架提供数据发布服务;  
尝试将`Vue`与`Leaflet`相融合，实现基于WebGIS的组件化前端系统实现.  


#### 功能实现
本平台可以实现自动实时爬取全球共享潮位站数据，提供全球潮位站的天文潮潮位数据检索、查询、显示功能。自动生成展示全球不同区域风暴潮预警报产品。后台服务提供通用的调用接口。  

#### 后端实现  
本系统后端采用 fastapi+sqlalchemy2.0 ,详见[后端工程](https://github.com/evaseemefly/GlobalSurgeSys)
![fastapi](./public/static/icons/fastapi/fastapi-tutorial.png)   

开源不易，若有引用请注明[出处](https://github.com/evaseemefly/GlobalSurgeCli)，谢谢！    

-------
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

+ 23-04-11 update 潮位form中的chart中的tooltip格式以及修改了 surgeTable 中的部分bug;修改surge与tide不再向下填充,增水向下填充
![v0.1](./docs/imgs/008.png) 
-------