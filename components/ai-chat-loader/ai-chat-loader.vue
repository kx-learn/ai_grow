<template>
  <view class="ai-loading-wrap">
    <view class="ai-loader-core">
      <view class="ai-loader-glow" />
      <view class="ai-loader-dots">
        <view class="ai-loader-dot ai-loader-dot--1" />
        <view class="ai-loader-dot ai-loader-dot--2" />
        <view class="ai-loader-dot ai-loader-dot--3" />
      </view>
    </view>
    <text class="ai-loader-hint">{{ hint || 'AI 正在思考' }}</text>
  </view>
</template>

<script setup>
defineProps({
  hint: { type: String, default: '' },
  code: { type: String, default: '' }
})
</script>

<style scoped>
.ai-loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 108rpx;
  padding: 12rpx 8rpx 8rpx;
  box-sizing: border-box;
}

.ai-loader-core {
  position: relative;
  width: 120rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-loader-glow {
  position: absolute;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 172, 254, 0.28) 0%, transparent 72%);
  pointer-events: none;
  opacity: 0.2;
  animation: aiGlowPulse 1.1s ease-in-out infinite;
}

.ai-loader-dots {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14rpx;
  height: 40rpx;
}

.ai-loader-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #6cb4ee 0%, #4facfe 100%);
  box-shadow: 0 2rpx 8rpx rgba(79, 172, 254, 0.35);
  opacity: 0.4;
  animation: aiDotWave 1.05s ease-in-out infinite;
}

.ai-loader-dot--1 { animation-delay: 0s; }
.ai-loader-dot--2 { animation-delay: 0.14s; }
.ai-loader-dot--3 { animation-delay: 0.28s; }

.ai-loader-hint {
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #7a9bb8;
  letter-spacing: 1rpx;
}

@keyframes aiDotWave {
  0%, 100% { transform: translateY(0) scale(0.88); opacity: 0.4; }
  50% { transform: translateY(-10rpx) scale(1); opacity: 1; }
}

@keyframes aiGlowPulse {
  0%, 100% { transform: scale(0.92); opacity: 0.18; }
  50% { transform: scale(1.12); opacity: 0.32; }
}

@media (prefers-reduced-motion: reduce) {
  .ai-loader-dot,
  .ai-loader-glow {
    animation: none !important;
  }
  .ai-loader-dot { opacity: 0.55; }
  .ai-loader-glow { opacity: 0.2; }
}
</style>
