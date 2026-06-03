<template>
	<view class="sv-wrap">
		<swiper
			class="sv-swiper"
			:vertical="true"
			:current="currentIndex"
			:disable-touch="true"
			@change="onSwiperChange"
		>
			<swiper-item v-for="(item, index) in videoList" :key="index">
				<view class="sv-slide">
					<!-- 视频 — 纯画面，不显示原生控件 -->
					<video
						:id="'sv-video-' + index"
						class="sv-video"
						:src="item.src"
						:poster="item.poster || ''"
						:autoplay="index === currentIndex"
						:loop="true"
						:muted="false"
						:controls="false"
						:show-fullscreen-btn="false"
						:show-play-btn="false"
						:show-center-play-btn="false"
						:enable-progress-gesture="false"
						:vslide-gesture="false"
						:vslide-gesture-in-fullscreen="false"
						:page-gesture="true"
						:object-fit="item.objectFit || 'cover'"
					></video>

					<!-- 透明触摸层：拦截原生 video 吞掉的手势，手动检测上下滑动切换视频 -->
					<view
						class="sv-touch-layer"
						@touchstart="onTouchStart"
						@touchmove="onTouchMove"
						@touchend="onTouchEnd($event, index)"
					></view>

					<!-- 左上返回 -->
					<view class="sv-back" @click.stop="$emit('close')">
						<image class="sv-back-icon" src="/static/back.png" />
					</view>

					<!-- 右侧交互栏 -->
					<view class="sv-interaction">
						<!-- 用户头像 -->
						<view class="sv-item">
							<image class="sv-avatar" src="/static/ling.png" />
						</view>
						<!-- 红心点赞 -->
						<view class="sv-item" @click.stop="toggleLike(index)">
							<image
								class="sv-icon"
								:src="'/static/scroll-video/' + (isLiked(index) ? 'like_active' : 'like') + '.png'"
							/>
							<text class="sv-total">{{ item.likeCount || '赞' }}</text>
						</view>
						<!-- 评论（仅展示） -->
						<view class="sv-item">
							<image class="sv-icon" src="/static/scroll-video/chat.png" />
							<text class="sv-total">{{ item.commentCount || '评论' }}</text>
						</view>
						<!-- 收藏（仅展示） -->
						<view class="sv-item">
							<image
								class="sv-icon"
								:src="'/static/scroll-video/' + (item.collectActive ? 'star_active' : 'star') + '.png'"
							/>
							<text class="sv-total">{{ item.collectCount || '收藏' }}</text>
						</view>
					</view>
				</view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
export default {
	name: 'ScrollVideo',
	emits: ['clickEventListener', 'scrollVideoChange', 'close'],
	props: {
		initialIndex: { type: Number, default: 0 },
		videoList: { type: Array, default: () => [] },
	},
	data() {
		return {
			currentIndex: this.initialIndex,
			localLikes: {},
			touchStartX: 0,
			touchStartY: 0,
			touchStartTime: 0,
			touchMoved: false,
			isPaused: false,
		};
	},
	watch: {
		initialIndex(val) {
			if (val >= 0 && val !== this.currentIndex) {
				this.currentIndex = val;
			}
		},
		videoList: {
			handler(newList) {
				const likes = {};
				newList.forEach((item, i) => {
					if (item.likeActive) {
						likes[i] = true;
					}
				});
				this.localLikes = likes;
			},
			immediate: true,
			deep: true,
		},
	},
	mounted() {
		this.$nextTick(() => {
			this.playCurrent();
		});
	},
	methods: {
		isLiked(index) {
			if (this.localLikes.hasOwnProperty(index)) {
				return this.localLikes[index];
			}
			const item = this.videoList[index];
			return item ? item.likeActive : false;
		},
		toggleLike(index) {
			const newState = !this.isLiked(index);
			this.$set(this.localLikes, index, newState);
			this.$emit('clickEventListener', { type: 'like', index, active: newState });
		},
		onSwiperChange(e) {
			const nextIndex = Number(e.detail.current);
			if (Number.isNaN(nextIndex)) return;
			this.switchToVideo(nextIndex);
		},
		// 统一的视频切换逻辑：更新索引、暂停上一个、播放当前
		switchToVideo(index) {
			if (index < 0 || index >= this.videoList.length) return;
			if (index === this.currentIndex) return;

			const prevIndex = this.currentIndex;
			this.currentIndex = index;
			this.isPaused = false;
			this.$emit('scrollVideoChange', index);

			this.stopVideo(prevIndex);
			this.$nextTick(() => {
				this.playCurrent();
			});
		},
		// ===== 透明触摸层：手动检测上下滑动手势 =====
		onTouchStart(e) {
			const touch = e.touches[0];
			this.touchStartX = touch.clientX;
			this.touchStartY = touch.clientY;
			this.touchStartTime = Date.now();
			this.touchMoved = false;
		},
		onTouchMove(e) {
			const touch = e.touches[0];
			const dx = touch.clientX - this.touchStartX;
			const dy = touch.clientY - this.touchStartY;
			if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
				this.touchMoved = true;
			}
		},
		onTouchEnd(e, index) {
			const touch = e.changedTouches[0];
			const dx = touch.clientX - this.touchStartX;
			const dy = touch.clientY - this.touchStartY;

			// 垂直滑动且距离足够 → 切换视频
			if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
				if (dy < 0) {
					this.switchToVideo(this.currentIndex + 1);
				} else {
					this.switchToVideo(this.currentIndex - 1);
				}
				return;
			}

			// 几乎没有移动 → 视为点击，切换播放/暂停
			if (!this.touchMoved && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
				this.togglePlay(index);
			}
		},
		togglePlay(index) {
			const ctx = uni.createVideoContext('sv-video-' + index, this);
			if (!ctx) return;
			if (this.isPaused) {
				ctx.play();
				this.isPaused = false;
			} else {
				ctx.pause();
				this.isPaused = true;
			}
		},
		playCurrent() {
			this.$nextTick(() => {
				const ctx = uni.createVideoContext('sv-video-' + this.currentIndex, this);
				if (ctx) ctx.play();
			});
		},
		stopVideo(index) {
			const ctx = uni.createVideoContext('sv-video-' + index, this);
			if (ctx) ctx.pause();
		},
		onClick(type, index) {
			this.$emit('clickEventListener', { type, index });
		},
		play() {
			this.$nextTick(() => {
				const ctx = uni.createVideoContext('sv-video-' + this.currentIndex, this);
				if (ctx) ctx.play();
			});
		},
		pause() {
			const ctx = uni.createVideoContext('sv-video-' + this.currentIndex, this);
			if (ctx) ctx.pause();
		},
	},
};
</script>

<style scoped>
.sv-wrap {
	position: fixed;
	inset: 0;
	z-index: 999;
	background-color: #000;
}
.sv-swiper {
	width: 100%;
	height: 100%;
}
.sv-slide {
	position: relative;
	width: 100%;
	height: 100%;
}
.sv-video {
	width: 100%;
	height: 100%;
}

/* 透明触摸层：覆盖在视频上方拦截手势，位于交互按钮下方 */
.sv-touch-layer {
	position: absolute;
	inset: 0;
	z-index: 5;
	background-color: transparent;
}

/* 左上返回 */
.sv-back {
	position: absolute;
	top: calc(var(--status-bar-height, 44px) + 12rpx);
	left: 24rpx;
	z-index: 10;
	width: 52rpx;
	height: 52rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.sv-back-icon {
	width: 44rpx;
	height: 44rpx;
}

/* 右侧红心 */
.sv-interaction {
	position: absolute;
	right: 16rpx;
	bottom: 200rpx;
	width: 100rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	z-index: 10;
}
.sv-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 44rpx;
}
.sv-item:last-child {
	margin-bottom: 0;
}
.sv-icon {
	width: 70rpx;
	height: 70rpx;
}
.sv-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	border: 3rpx solid #fff;
	margin-bottom: 16rpx;
}
.sv-total {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #fff;
	font-weight: bold;
	text-align: center;
}
</style>
