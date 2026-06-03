<script>
	import { initDatabase } from '@/utils/db.js';

	export default {
		onLaunch: function() {
			console.log('App Launch');
			initDatabase();
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #f4f1ea;
		font-family: -apple-system, "Microsoft YaHei", "Segoe UI", sans-serif;
		color: #191c1b;
	}
</style>
