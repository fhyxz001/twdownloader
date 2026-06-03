<template>
	<view class="page">
		<!-- 导航栏 -->
		<view class="nav-bar">
			<view class="nav-content">
				<view class="nav-header-row">
					<view class="nav-back" @tap="goBack">
						<text class="nav-back-icon">&#8249;</text>
						<text class="nav-back-text">返回</text>
					</view>
					<text class="nav-title">我喜欢的</text>
					<view class="nav-action" @tap="toggleEditMode">
						<text class="nav-action-text">{{ isEditMode ? '完成' : '编辑' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 收藏列表 -->
		<scroll-view class="fav-scroll" scroll-y>
			<view class="fav-list" v-if="favorites.length > 0">
				<view
					v-for="(item, index) in favorites"
					:key="item.id"
					class="swipe-wrapper"
				>
					<view
						class="swipe-content"
						:style="{ transform: 'translateX(' + (swipeOffset[index] || 0) + 'rpx)' }"
						@touchstart="onTouchStart($event, index)"
						@touchmove="onTouchMove($event, index)"
						@touchend="onTouchEnd($event, index)"
					>
						<view
							:class="['fav-item', isEditMode && selectedIds.has(item.id) ? 'fav-item-selected' : '']"
							@tap="onItemTap(item, index)"
							@longpress="onItemLongPress(item)"
						>
							<!-- 选择框 -->
							<view class="fav-check" v-if="isEditMode" @tap.stop="toggleSelect(item.id)">
								<view :class="['check-circle', selectedIds.has(item.id) ? 'check-circle-on' : '']">
									<text v-if="selectedIds.has(item.id)" class="check-mark">&#10003;</text>
								</view>
							</view>
							<!-- 缩略图 -->
							<view class="fav-thumb">
								<image v-if="item.thumbnail" class="thumb-img" :src="item.thumbnail" mode="aspectFill" />
								<view v-else class="thumb-fallback">
									<text class="thumb-fallback-icon">&#9654;</text>
								</view>
								<view class="thumb-play">
									<text class="thumb-play-icon">&#9654;</text>
								</view>
							</view>
							<!-- 信息 -->
							<view class="fav-info">
								<text class="fav-name">{{ item.title }}</text>
								<text class="fav-source">{{ item.source === 'files' ? '本地文件' : '探索发现' }}</text>
							</view>
							<!-- 红心 -->
							<view class="fav-heart" @tap.stop="unlikeItem(item)">
								<text class="heart-icon active">&#9829;</text>
							</view>
						</view>
					</view>
					<!-- 左滑取消收藏按钮 -->
					<view class="swipe-actions" v-if="!isEditMode">
						<view class="swipe-btn swipe-btn-unlike" @tap="unlikeItem(item)">
							<text class="swipe-btn-text">取消</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty" v-else>
				<text class="empty-icon">&#9825;</text>
				<text class="empty-title">暂无收藏</text>
				<text class="empty-desc">在播放时点击红心收藏喜欢的视频</text>
			</view>

			<view class="bottom-spacer"></view>
		</scroll-view>

		<!-- 编辑模式底部栏 -->
		<view class="edit-bar" v-if="isEditMode">
			<view class="edit-bar-inner">
				<text class="edit-select-all" @tap="toggleSelectAll">
					{{ isAllSelected ? '取消全选' : '全选' }}
				</text>
				<text class="edit-count">已选 {{ selectedIds.size }} 项</text>
				<text
					:class="['edit-delete', selectedIds.size === 0 ? 'edit-delete-disabled' : '']"
					@tap="deleteSelected"
				>
					取消收藏
				</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getFavorites, removeFavorite } from '@/utils/db.js';

const UNLIKE_BTN_WIDTH = 180;

export default {
	data() {
		return {
			favorites: [],
			isEditMode: false,
			selectedIds: new Set(),
			swipeOffset: {},
			touchStartX: 0,
			touchStartY: 0,
			swiping: false,
			swipingIndex: -1,
			openIndex: -1,
		};
	},
	computed: {
		isAllSelected() {
			return this.favorites.length > 0 && this.favorites.every(item => this.selectedIds.has(item.id));
		},
		playVideoList() {
			return this.favorites.map(item => ({
				src: item.url,
				description: item.title || item.id,
				poster: item.thumbnail || '',
				objectFit: 'cover',
				userAvatar: null,
				userName: item.title || item.id,
				userFollow: null,
				likeActive: true,
				likeCount: null,
				commentCount: null,
				collectActive: false,
				collectCount: null,
				fav: {
					id: item.id,
					title: item.title || item.id,
					url: item.url,
					thumbnail: item.thumbnail || '',
					source: item.source || 'favorites',
					extra: item.extra || {},
				},
			}));
		},
	},
	onShow() {
		this.loadFavorites();
	},
	methods: {
		async loadFavorites() {
			try {
				this.favorites = await getFavorites();
			} catch (e) {
				this.favorites = [];
			}
		},
		goBack() {
			uni.navigateBack({ delta: 1 });
		},

		// ===== 编辑模式 =====
		toggleEditMode() {
			this.isEditMode = !this.isEditMode;
			if (!this.isEditMode) this.selectedIds = new Set();
			this.closeAllSwipe();
		},
		toggleSelect(id) {
			const newSet = new Set(this.selectedIds);
			if (newSet.has(id)) newSet.delete(id);
			else newSet.add(id);
			this.selectedIds = newSet;
		},
		toggleSelectAll() {
			const newSet = new Set(this.selectedIds);
			if (this.isAllSelected) {
				this.favorites.forEach(item => newSet.delete(item.id));
			} else {
				this.favorites.forEach(item => newSet.add(item.id));
			}
			this.selectedIds = newSet;
		},

		// ===== 列表点击 =====
		onItemTap(item, index) {
			if (this.isEditMode) {
				this.toggleSelect(item.id);
			} else {
				if (this.openIndex === index) {
					this.closeSwipe(index);
					return;
				}
				if (this.openIndex >= 0) {
					this.closeSwipe(this.openIndex);
					return;
				}
				this.playFile(index);
			}
		},
		onItemLongPress(item) {
			if (!this.isEditMode) {
				this.isEditMode = true;
				this.selectedIds = new Set([item.id]);
				this.closeAllSwipe();
			}
		},

		// ===== 左滑取消收藏 =====
		onTouchStart(e, index) {
			if (this.isEditMode) return;
			const touch = e.touches[0];
			this.touchStartX = touch.clientX;
			this.touchStartY = touch.clientY;
			this.swiping = false;
			this.swipingIndex = index;
			if (this.openIndex >= 0 && this.openIndex !== index) {
				this.$set(this.swipeOffset, this.openIndex, 0);
				this.openIndex = -1;
			}
		},
		onTouchMove(e, index) {
			if (this.isEditMode || this.swipingIndex !== index) return;
			const touch = e.touches[0];
			const deltaX = touch.clientX - this.touchStartX;
			const deltaY = touch.clientY - this.touchStartY;
			if (!this.swiping) {
				if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
					this.swiping = true;
				} else {
					return;
				}
			}
			const pxToRpx = 750 / uni.getSystemInfoSync().windowWidth;
			const currentOffset = this.swipeOffset[index] || 0;
			let newOffset = currentOffset + deltaX * pxToRpx;
			if (newOffset > 0) newOffset = 0;
			if (newOffset < -UNLIKE_BTN_WIDTH * 1.2) newOffset = -UNLIKE_BTN_WIDTH * 1.2;
			this.$set(this.swipeOffset, index, newOffset);
		},
		onTouchEnd(e, index) {
			if (this.isEditMode || this.swipingIndex !== index) return;
			if (!this.swiping) {
				this.swipingIndex = -1;
				return;
			}
			this.swiping = false;
			this.swipingIndex = -1;
			const currentOffset = this.swipeOffset[index] || 0;
			if (currentOffset < -UNLIKE_BTN_WIDTH / 2) {
				this.$set(this.swipeOffset, index, -UNLIKE_BTN_WIDTH);
				this.openIndex = index;
			} else {
				this.$set(this.swipeOffset, index, 0);
				if (this.openIndex === index) this.openIndex = -1;
			}
		},
		closeSwipe(index) {
			this.$set(this.swipeOffset, index, 0);
			if (this.openIndex === index) this.openIndex = -1;
		},
		closeAllSwipe() {
			for (const key in this.swipeOffset) {
				if (this.swipeOffset[key] !== 0) {
					this.$set(this.swipeOffset, key, 0);
				}
			}
			this.openIndex = -1;
		},

		// ===== 取消收藏 =====
		async unlikeItem(item) {
			this.closeAllSwipe();
			try {
				await removeFavorite(item.id);
				this.favorites = this.favorites.filter(f => f.id !== item.id);
				this.swipeOffset = {};
				this.openIndex = -1;
			} catch (e) {
				uni.showToast({ title: '操作失败', icon: 'none' });
			}
		},
		async deleteSelected() {
			if (this.selectedIds.size === 0) return;
			uni.showModal({
				title: '确认取消',
				content: `确定取消收藏选中的 ${this.selectedIds.size} 个视频？`,
				success: async (res) => {
					if (res.confirm) {
						for (const id of this.selectedIds) {
							try { await removeFavorite(id); } catch (e) {}
						}
						this.isEditMode = false;
						this.selectedIds = new Set();
						await this.loadFavorites();
					}
				},
			});
		},

		// ===== 播放 =====
		playFile(index) {
			if (!this.favorites.length) return;
			const list = this.playVideoList;
			uni.navigateTo({
				url: '/pages/play/play',
				success: (res) => {
					res.eventChannel.emit('initData', { list, index });
				},
			});
		},
	},
};
</script>

<style scoped>
.page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #F2F2F7;
}

/* 导航栏 */
.nav-bar {
	background-color: #F2F2F7;
	padding-top: var(--status-bar-height, 44px);
}
.nav-content {
	padding: 12rpx 32rpx 16rpx;
}
.nav-header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.nav-back {
	display: flex;
	align-items: center;
	gap: 4rpx;
}
.nav-back-icon {
	font-size: 44rpx;
	color: #007AFF;
	font-weight: 300;
}
.nav-back-text {
	font-size: 30rpx;
	color: #007AFF;
}
.nav-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1C1C1E;
}
.nav-action {
	padding: 8rpx 16rpx;
}
.nav-action-text {
	font-size: 30rpx;
	color: #007AFF;
	font-weight: 500;
}

/* 列表 */
.fav-scroll {
	flex: 1;
	overflow: hidden;
}
.fav-list {
	padding: 0 32rpx;
}

/* 左滑容器 */
.swipe-wrapper {
	position: relative;
	margin-bottom: 12rpx;
	overflow: hidden;
	border-radius: 20rpx;
}
.swipe-content {
	position: relative;
	z-index: 2;
	transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.swipe-actions {
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 1;
	display: flex;
	align-items: stretch;
}
.swipe-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 180rpx;
}
.swipe-btn-unlike {
	background-color: #FF9500;
	border-radius: 0 20rpx 20rpx 0;
}
.swipe-btn-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 600;
}

/* 收藏项 */
.fav-item {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background-color: #fff;
	gap: 20rpx;
}
.fav-item-selected {
	background-color: rgba(255, 59, 48, 0.06);
}

/* 选择框 */
.fav-check {
	flex-shrink: 0;
}
.check-circle {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	border: 3rpx solid #C7C7CC;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s ease;
}
.check-circle-on {
	background-color: #FF3B30;
	border-color: #FF3B30;
}
.check-mark {
	color: #fff;
	font-size: 24rpx;
	font-weight: 700;
}

/* 缩略图 */
.fav-thumb {
	position: relative;
	width: 120rpx;
	height: 90rpx;
	border-radius: 12rpx;
	overflow: hidden;
	flex-shrink: 0;
	background-color: #1C1C1E;
}
.thumb-img {
	width: 100%;
	height: 100%;
}
.thumb-fallback {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.thumb-fallback-icon {
	color: rgba(255, 255, 255, 0.3);
	font-size: 32rpx;
}
.thumb-play {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.thumb-play-icon {
	color: rgba(255, 255, 255, 0.85);
	font-size: 28rpx;
	text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.5);
}

/* 信息 */
.fav-info {
	flex: 1;
	min-width: 0;
}
.fav-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #1C1C1E;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
}
.fav-source {
	font-size: 22rpx;
	color: #8E8E93;
	margin-top: 6rpx;
	display: block;
}

/* 红心 */
.fav-heart {
	flex-shrink: 0;
	padding: 8rpx;
}
.heart-icon {
	font-size: 40rpx;
}
.heart-icon.active {
	color: #FF3B30;
}

/* 空状态 */
.empty {
	padding: 160rpx 40rpx;
	text-align: center;
}
.empty-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
	color: #FF3B30;
}
.empty-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1C1C1E;
	display: block;
	margin-bottom: 8rpx;
}
.empty-desc {
	font-size: 28rpx;
	color: #8E8E93;
	display: block;
}

.bottom-spacer {
	height: 140rpx;
}

/* 编辑栏 */
.edit-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 50;
	background-color: rgba(249, 249, 249, 0.94);
	backdrop-filter: blur(20px);
	border-top: 1rpx solid rgba(0, 0, 0, 0.08);
}
.edit-bar-inner {
	display: flex;
	align-items: center;
	padding: 16rpx 32rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	gap: 20rpx;
}
.edit-select-all {
	font-size: 28rpx;
	color: #007AFF;
	font-weight: 500;
}
.edit-count {
	flex: 1;
	font-size: 26rpx;
	color: #8E8E93;
}
.edit-delete {
	font-size: 28rpx;
	color: #fff;
	font-weight: 600;
	padding: 14rpx 36rpx;
	border-radius: 20rpx;
	background-color: #FF9500;
}
.edit-delete-disabled {
	opacity: 0.4;
}
</style>
