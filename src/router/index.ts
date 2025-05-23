import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ForecastHomeView from '../views/ForecastHomeView.vue'
import GlobalForecastHomeView from '../views/GlobalForecastHomeView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
	},
	{
		// 温带风暴潮系统
		path: '/forecast',
		name: 'home',
		component: ForecastHomeView,
	},
	{
		// 全球模式
		path: '/global/surge',
		name: 'home',
		component: GlobalForecastHomeView,
	},
	// {
	// 	path: '/about',
	// 	name: 'about',
	// 	// route level code-splitting
	// 	// this generates a separate chunk (about.[hash].js) for this route
	// 	// which is lazy-loaded when the route is visited.
	// 	component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
	// },
]

const router = new VueRouter({
	mode: 'history',
	// @ts-ignore
	base: process.env.BASE_URL,
	routes,
})

export default router
