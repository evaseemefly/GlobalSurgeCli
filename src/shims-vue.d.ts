declare module '*.vue' {
	import Vue from 'vue'
	export default Vue
}

import Vue from 'vue'
import consola from 'consola'

declare module 'vue/types/vue' {
	interface Vue {
		$log: typeof consola // 为 Vue 实例添加 $log 属性
	}
}
