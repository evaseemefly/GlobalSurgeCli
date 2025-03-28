declare module '*.vue' {
	import Vue from 'vue'
	export default Vue
}

import Vue from 'vue'
import consola from 'consola'
import { Message } from 'element-ui'

declare module 'vue/types/vue' {
	interface Vue {
		$log: typeof consola // 为 Vue 实例添加 $log 属性
		$message: typeof Message // 为 Vue 实例添加 $message 属性 —— element-ui Message
	}
}
