const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const resolve = (dir) => path.join(__dirname, dir)
module.exports = defineConfig({
	transpileDependencies: true,
	productionSourceMap: true,
	runtimeCompiler: true,
	chainWebpack: (config) => {
		config.resolve.alias.set('@', resolve('src'))
		config.plugin('html').tap((args) => {
			args[0].title = '风暴潮预报观测系统v1.0'
			return args
		})
	},
	// TODO:[-] 24-10-31 此处加入可供client调试选项
	configureWebpack: {
		// webpack配置，值位对象时会合并配置，为方法时会改写配置
		// config.devtool = 'cheap-module-eval-source-map'
		devtool: 'cheap-module-source-map',
		// if (debug) {
		// 	// 开发环境配置
		// } else {
		// 	// 生产环境配置
		// }
	},
	devServer: {
		// 由之前的 'localhost'改为如下，端口默认8080
		host: '0.0.0.0',
		port: '8085',
		// options has an unknown property 'overlay'. These properties are valid:
		// overlay: {
		// 	warnings: false,
		// 	errors: false,
		// },
	},
})
