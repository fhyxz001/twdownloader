<template>
	<view class="sv-wrap">
		<swiper
			class="sv-swiper"
			:vertical="true"
			:current="currentIndex"
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
						:page-gesture="false"
						:object-fit="item.objectFit || 'cover'"
					>
						<!-- 左上返回 -->
						<cover-view class="sv-back" @click.stop="$emit('close')">
							<cover-image class="sv-back-icon" src="/static/back.png" />
						</cover-view>

						<!-- 右侧交互栏 -->
						<cover-view class="sv-interaction">
							<!-- 用户头像 -->
							<cover-view class="sv-item">
								<cover-image class="sv-avatar" src="/static/ling.png" />
							</cover-view>
							<!-- 红心点赞 -->
							<cover-view class="sv-item" @click.stop="toggleLike(index)">
								<cover-image
									class="sv-icon"
									:src="'/static/scroll-video/' + (isLiked(index) ? 'like_active' : 'like') + '.png'"
								/>
								<cover-view class="sv-total">{{ item.likeCount || '赞' }}</cover-view>
							</cover-view>
							<!-- 评论（仅展示） -->
							<cover-view class="sv-item">
								<cover-image class="sv-icon" src="/static/scroll-video/chat.png" />
								<cover-view class="sv-total">{{ item.commentCount || '评论' }}</cover-view>
							</cover-view>
							<!-- 收藏（仅展示） -->
							<cover-view class="sv-item">
								<cover-image
									class="sv-icon"
									:src="'/static/scroll-video/' + (item.collectActive ? 'star_active' : 'star') + '.png'"
								/>
								<cover-view class="sv-total">{{ item.collectCount || '收藏' }}</cover-view>
							</cover-view>
						</cover-view>
					</video>
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
			const prevIndex = this.currentIndex;
			const nextIndex = Number(e.detail.current);
			if (Number.isNaN(nextIndex) || nextIndex === prevIndex) return;

			this.currentIndex = nextIndex;
			this.$emit('scrollVideoChange', nextIndex);

			this.stopVideo(prevIndex);
			this.$nextTick(() => {
				this.playCurrent();
			});
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
	bottom: 80rpx;
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
