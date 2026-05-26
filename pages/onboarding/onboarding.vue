<template>
  <view class="onboarding-page">
    <view class="bg-bubbles">
      <view class="bubble b1"></view>
      <view class="bubble b2"></view>
      <view class="bubble b3"></view>
    </view>

    <scroll-view class="scroll" scroll-y :show-scrollbar="false">
      <view class="content" :class="{ show: loaded }">
        <view class="title-area">
          <text class="title">完善你的资料</text>
          <text class="subtitle">首次使用需填写以下信息，以便 AI 更好地为你制定成长计划</text>
        </view>

        <view class="form-card">
          <view class="input-group">
            <text class="label">昵称</text>
            <input
              class="form-input"
              v-model="form.nickname"
              placeholder="怎么称呼你"
              placeholder-class="ph"
            />
          </view>

          <view class="input-group">
            <text class="label">年龄</text>
            <input
              class="form-input"
              v-model="form.age"
              type="number"
              placeholder="例如 22"
              placeholder-class="ph"
            />
          </view>

          <view class="input-group">
            <text class="label">职业 / 身份</text>
            <input
              class="form-input"
              v-model="form.occupation"
              placeholder="例如 学生、产品经理"
              placeholder-class="ph"
            />
          </view>

          <view class="input-group">
            <text class="label">兴趣爱好</text>
            <textarea
              class="form-textarea"
              v-model="form.hobbies"
              placeholder="例如 跑步、阅读、摄影"
              placeholder-class="ph"
              :maxlength="200"
              auto-height
            />
          </view>

          <view class="input-group">
            <text class="label">想探索的方向</text>
            <textarea
              class="form-textarea"
              v-model="form.explorationInterests"
              placeholder="例如 时间管理、健身习惯、英语学习"
              placeholder-class="ph"
              :maxlength="300"
              auto-height
            />
          </view>

          <button class="btn-submit" :class="{ active: canSubmit }" :disabled="submitting" @tap="onSubmit">
            <text class="btn-text">{{ submitting ? '提交中…' : '完成并进入' }}</text>
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getUserInfo, updateOnboarding } from '../../utils/api.js'
import { isOnboardingCompleted } from '../../utils/onboarding.js'

const loaded = ref(false)
const submitting = ref(false)

const form = ref({
  nickname: '',
  age: '',
  occupation: '',
  hobbies: '',
  explorationInterests: ''
})

const canSubmit = computed(() => {
  const f = form.value
  const age = Number(f.age)
  return (
    f.nickname.trim().length > 0 &&
    f.occupation.trim().length > 0 &&
    f.hobbies.trim().length > 0 &&
    f.explorationInterests.trim().length > 0 &&
    !isNaN(age) &&
    age >= 1 &&
    age <= 120 &&
    !submitting.value
  )
})

onMounted(() => {
  nextTick(() => { setTimeout(() => { loaded.value = true }, 50) })
  getUserInfo().then(res => {
    if (isOnboardingCompleted(res)) {
      uni.reLaunch({ url: '/pages/index/index' })
      return
    }
    form.value.nickname = res.nickname || ''
    if (res.age != null) form.value.age = String(res.age)
    form.value.occupation = res.occupation || ''
    form.value.hobbies = res.hobbies || ''
    form.value.explorationInterests = res.explorationInterests || ''
  }).catch(() => {})
})

async function onSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完整填写各项信息', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await updateOnboarding({
      nickname: form.value.nickname.trim(),
      age: Number(form.value.age),
      occupation: form.value.occupation.trim(),
      hobbies: form.value.hobbies.trim(),
      explorationInterests: form.value.explorationInterests.trim(),
      onboardingCompleted: true
    })
    uni.setStorageSync('onboardingCompleted', true)
    const { onAuthSuccess } = await import('../../utils/afterAuth.js')
    onAuthSuccess()
    uni.showToast({ title: '资料已保存', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 600)
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.onboarding-page {
  height: 100%;
  background: linear-gradient(180deg, #e8f4fd 0%, #f5f9fc 40%, #ffffff 100%);
  position: relative;
  overflow: hidden;
}

.bg-bubbles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.b1 { width: 280rpx; height: 280rpx; background: #4facfe; top: -80rpx; right: -60rpx; }
.b2 { width: 180rpx; height: 180rpx; background: #7b6df0; top: 200rpx; left: -50rpx; }
.b3 { width: 120rpx; height: 120rpx; background: #4facfe; bottom: 200rpx; right: 40rpx; }

.scroll {
  height: 100%;
}

.content {
  padding: 120rpx 40rpx 60rpx;
  opacity: 0;
  transition: opacity 0.4s ease-out;
}

.content.show {
  opacity: 1;
}

.title-area {
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #888;
  line-height: 1.5;
}

.form-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(79, 172, 254, 0.1);
}

.input-group {
  margin-bottom: 28rpx;
}

.label {
  display: block;
  font-size: 26rpx;
  color: #555;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  background: #f5f9fc;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #333;
  background: #f5f9fc;
  border-radius: 16rpx;
  box-sizing: border-box;
  line-height: 1.5;
}

.ph {
  color: #bbb;
  font-size: 28rpx;
}

.btn-submit {
  margin-top: 16rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: #d0e8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-submit.active {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  box-shadow: 0 8rpx 24rpx rgba(79, 172, 254, 0.35);
}

.btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
}

.btn-submit:not(.active) .btn-text {
  color: #99c4e8;
}
</style>
