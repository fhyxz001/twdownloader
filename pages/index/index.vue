<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">TW Downloader</text>
		</view>
		<view class="entry-list">
			<view class="entry-card" @tap="goWaterfall">
				<text class="entry-icon">&#9634;</text>
				<view class="entry-info">
					<text class="entry-title">瀑布流预览</text>
					<text class="entry-desc">浏览海报，选择下载</text>
				</view>
				<text class="entry-arrow">&rarr;</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {
			goWaterfall() {
				uni.navigateTo({
					url: '/pages/waterfall/waterfall'
				});
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 120rpx;
		margin-bottom: 40rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
		margin-bottom: 60rpx;
	}

	.title {
		font-size: 40rpx;
		font-weight: 800;
		color: #191c1b;
	}

	.entry-list {
		width: 100%;
	}

	.entry-card {
		display: flex;
		align-items: center;
		padding: 32rpx 28rpx;
		background-color: rgba(255, 255, 255, 0.88);
		border: 2rpx solid rgba(38, 42, 39, 0.12);
		border-radius: 16rpx;
		box-shadow: 0 8rpx 24rpx rgba(31, 28, 23, 0.08);
	}

	.entry-icon {
		font-size: 48rpx;
		color: #0f766e;
		margin-right: 24rpx;
	}

	.entry-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.entry-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #191c1b;
	}

	.entry-desc {
		font-size: 24rpx;
		color: #6b6f6a;
	}

	.entry-arrow {
		font-size: 32rpx;
		color: #0f766e;
		font-weight: 700;
	}
</style>
