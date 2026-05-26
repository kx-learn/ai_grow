import { getAccessToken, getUserInfo } from './api.js'

const ONBOARDING_ROUTE = 'pages/onboarding/onboarding'

export function isOnboardingCompleted(user) {
  return user?.onboardingCompleted === true
}

function isOnOnboardingPage() {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  const route = cur?.route || ''
  return route === ONBOARDING_ROUTE || route.endsWith('/onboarding/onboarding')
}

/**
 * 检查是否已完成首次画像；未完成则 reLaunch 到引导页。
 * @returns {Promise<boolean>} true = 已完成，可进入主流程
 */
export async function ensureOnboardingCompleted(options = {}) {
  const { redirect = true } = options
  if (!getAccessToken()) return true
  if (isOnOnboardingPage()) return false

  try {
    const user = await getUserInfo()
    if (isOnboardingCompleted(user)) {
      uni.setStorageSync('onboardingCompleted', true)
      return true
    }
    uni.setStorageSync('onboardingCompleted', false)
    if (redirect) {
      uni.reLaunch({ url: '/pages/onboarding/onboarding' })
    }
    return false
  } catch (e) {
    console.warn('[onboarding] check failed', e)
    return true
  }
}
