import { Loading } from 'element-ui'
/**
 * 公共的 loading 方法
 *
 * @param {string} msg
 * @param {{ fullscreen: boolean; text?: string }} [options={ fullscreen: true }]
 */
export const loading = (
	msg: string,
	options: { fullscreen: boolean; background: string; text?: string } = {
		fullscreen: true,
		background: 'rgba(4, 107, 114, 0.639)',
	}
) => {
	return Loading.service(options)
}
