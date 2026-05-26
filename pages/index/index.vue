<template>
  <view class="page" :class="{ 'keyboard-open': keyboardHeight > 0 }">
    <growth-task-mini-bar />
    <view class="chat-header" :class="{ show: loaded }" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="chat-header-bg" aria-hidden="true">
        <view class="chat-header-orb chat-header-orb--1" />
        <view class="chat-header-orb chat-header-orb--2" />
      </view>
      <view class="chat-header-main">
        <view class="chat-brand">
          <view class="chat-brand-mark">
            <text class="chat-brand-letter">AI</text>
          </view>
          <view class="chat-brand-copy">
            <text class="chat-brand-title">AI成长</text>
            <text class="chat-brand-sub">{{ chatHeaderSubtitle }}</text>
          </view>
        </view>
        <view class="chat-header-tools">
          <view class="chat-tool-btn" @tap="goNotifications">
            <view class="chat-tool-icon chat-tool-icon--bell" />
            <view v-if="store.unreadCount > 0" class="chat-tool-badge">
              <text class="chat-tool-badge-txt">{{ store.unreadCount > 99 ? '99+' : store.unreadCount }}</text>
            </view>
          </view>
          <view class="chat-tool-btn chat-tool-btn--avatar" @tap="goLogin">
            <image
              v-if="userAvatar"
              :src="userAvatar"
              class="chat-tool-avatar"
              mode="aspectFill"
            />
            <view v-else class="chat-tool-icon chat-tool-icon--user" />
          </view>
        </view>
      </view>
      <scroll-view class="chat-quick-scroll" scroll-x :show-scrollbar="false" :bounces="false">
        <view class="chat-quick-row">
          <view class="chat-action-chip" @tap="openHistory">
            <view class="chat-chip-icon chat-chip-icon--history" />
            <text class="chat-chip-label">历史对话</text>
          </view>
          <view class="chat-action-chip chat-action-chip--primary" @tap="createNewSession">
            <view class="chat-chip-icon chat-chip-icon--plus" />
            <text class="chat-chip-label">新对话</text>
          </view>
          <view class="chat-action-chip" @tap="goPlans">
            <view class="chat-chip-icon chat-chip-icon--plan" />
            <text class="chat-chip-label">我的计划</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view
      class="chat-scroll"
      scroll-y
      :bounces="false"
      :show-scrollbar="false"
      :scroll-top="scrollTop"
      scroll-with-animation
    >
      <view class="msg-list">
        <view
          v-for="(msg, i) in messages"
          :key="i"
          class="msg-item"
          :class="[msg.role === 'user' ? 'align-right' : 'align-left', { show: msg.show }]"
          :style="{ transitionDelay: (i * 0.06) + 's' }"
        >
          <view v-if="msg.role === 'ai'" class="ai-avatar">
              <text style="font-size:36rpx;">🤖</text>
            </view>
            <view v-if="msg.role === 'ai'" class="card-ai">
            <view v-if="msg.type === 'loading'" class="ai-loading-wrap">
              <view class="loader">
                <view class="loader-ship">
                  <view></view>
                  <view></view>
                  <view></view>
                  <view></view>
                  <view class="base">
                    <view></view>
                  </view>
                  <view class="face"></view>
                </view>
                <view class="longfazers">
                  <view></view>
                  <view></view>
                  <view></view>
                  <view></view>
                </view>
              </view>
            </view>
            <view v-else-if="msg.type === 'reminderAction'" class="reminder-action-card" :class="'reminder-' + msg.variant">
              <view class="reminder-rail" />
              <view class="reminder-card-body">
                <view class="reminder-top-band">
                  <view class="reminder-badge">
                    <text class="reminder-badge-txt">{{ msg.icon }}</text>
                  </view>
                  <view class="reminder-top-copy">
                    <text class="reminder-top-label">{{ msg.label }}</text>
                    <text class="reminder-top-sub">{{ msg.subtitle }}</text>
                  </view>
                  <text class="reminder-top-chip">{{ reminderStatusChip(msg) }}</text>
                </view>
                <view v-if="msg.content" class="reminder-copy-panel">
                  <markdown-content class="reminder-copy-md" :content="msg.content" />
                </view>
                <view v-if="msg.tasksLoading" class="reminder-sync-row">
                  <view class="reminder-sync-spinner" />
                  <text class="reminder-sync-txt">正在同步提醒列表…</text>
                </view>
                <view v-else-if="msg.tasksLoaded" class="reminder-schedule-block">
                  <view class="reminder-schedule-head">
                    <text class="reminder-schedule-title">{{ reminderCardTasksTitle(msg) }}</text>
                    <text class="reminder-schedule-count">{{ (msg.tasks && msg.tasks.length) || 0 }} 条</text>
                  </view>
                  <text v-if="msg.tasksError" class="reminder-schedule-empty">列表加载失败，请稍后在「我的计划」查看</text>
                  <view v-else-if="!msg.tasks || !msg.tasks.length" class="reminder-schedule-empty">
                    <text>当日暂无相关提醒</text>
                  </view>
                  <view v-else class="reminder-timeline">
                    <view
                      v-for="(t, ti) in msg.tasks"
                      :key="t.id"
                      class="reminder-timeline-node"
                      :class="'phase-' + t.phase"
                      :style="{ animationDelay: (ti * 0.05) + 's' }"
                    >
                      <view class="reminder-timeline-track">
                        <view class="reminder-timeline-dot" :style="{ borderColor: t.color, background: t.color }" />
                        <view v-if="ti < msg.tasks.length - 1" class="reminder-timeline-line" />
                      </view>
                      <view class="reminder-timeline-card">
                        <text class="reminder-timeline-time" :class="'time-' + t.phase">{{ t.time }}</text>
                        <text class="reminder-timeline-name">{{ t.name }}</text>
                      </view>
                    </view>
                  </view>
                  <view class="reminder-schedule-footer" @tap="goPlans(reminderPlanDate(msg))">
                    <text class="reminder-schedule-footer-txt">查看我的计划</text>
                    <text class="reminder-schedule-arrow">›</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else-if="msg.type === 'text'">
              <text class="ai-hd" v-if="msg.title">{{ msg.title }}</text>
              <markdown-content class="ai-bd" :content="msg.content" />
              <text class="ai-tip" v-if="msg.tip">{{ msg.tip }}</text>
            </view>
            <view v-else-if="msg.type === 'plan'">
              <text class="card-hd">{{ msg.content }}</text>
              <view class="plan-row" v-for="p in msg.plans" :key="p.name">
                <view class="plan-l">
                  <text style="font-size:22rpx;">⏰</text>
                  <text class="plan-nm">{{ p.name }}</text>
                </view>
                <text class="plan-tm">{{ p.time }}</text>
              </view>
              <view class="link-row" @tap="goPlans">
                <text class="link-txt">查看计划 ></text>
              </view>
            </view>
            <view v-else-if="msg.type === 'planProposal'" class="proposal-wrap">
              <markdown-content v-if="msg.content" class="ai-bd proposal-intro" :content="msg.content" />
              <view v-if="msg.loading" class="proposal-loading">
                <text class="proposal-loading-txt">正在加载计划详情...</text>
              </view>
              <template v-else>
              <view
                v-if="msg.status"
                class="proposal-status-badge"
                :class="'status-' + String(msg.status).toLowerCase()"
              >
                <text>{{ proposalStatusText(msg.status) }}</text>
              </view>
              <view v-if="msg.detail" class="proposal-body">
                <text class="proposal-title">{{ msg.detail.goalTitle }}</text>
                <text v-if="msg.detail.goalDescription" class="proposal-desc">{{ msg.detail.goalDescription }}</text>
                <text class="proposal-summary">{{ msg.detail.summary }}</text>
                <text class="proposal-meta">
                  📅 {{ formatPlanDate(msg.detail.startDate || (msg.detail.days && msg.detail.days[0] && msg.detail.days[0].scheduledDate)) }}
                  <text v-if="msg.detail.endDate"> — {{ formatPlanDate(msg.detail.endDate) }}</text>
                  · ⏰ 每日 {{ msg.detail.dailyReminderTime || '08:00' }}
                </text>
                <view class="proposal-day" v-for="d in (msg.detail.days || [])" :key="d.dayIndex">
                  <view class="day-hd">
                    <text class="day-tag">第{{ d.dayIndex }}天</text>
                    <text class="day-date">{{ formatPlanDate(d.scheduledDate) }}</text>
                    <text class="day-mins">{{ formatMinutes(d.estimatedMinutes) }}</text>
                  </view>
                  <text class="day-title">{{ d.title }}</text>
                  <text v-if="d.description" class="day-desc">{{ d.description }}</text>
                </view>
                <text v-if="msg.detail.expiresAt" class="proposal-expire">
                  草案有效期至 {{ formatPlanExpire(msg.detail.expiresAt) }}
                </text>
              </view>
              <view
                v-if="!msg.resolved && msg.status === 'PENDING' && msg.detail"
                class="proposal-actions"
              >
                <view
                  class="btn-proposal-reject"
                  :class="{ disabled: msg.acting }"
                  @tap="onRejectProposal(msg)"
                >
                  <text>拒绝</text>
                </view>
                <view
                  class="btn-proposal-confirm"
                  :class="{ disabled: msg.acting }"
                  @tap="onConfirmProposal(msg)"
                >
                  <text>{{ msg.acting === 'confirm' ? '确认中...' : '确认计划' }}</text>
                </view>
              </view>
              <view v-else-if="msg.resolved" class="proposal-done">
                <text>{{ msg.resultMessage }}</text>
              </view>
              </template>
            </view>
            <view v-else-if="msg.type === 'recommend'">
              <text class="card-hd">{{ msg.content }}</text>
              <view class="rec-row" v-for="(r, ri) in msg.items" :key="ri">
                <text class="rec-txt">{{ r }}</text>
              </view>
            </view>
            <view v-else-if="msg.type === 'stats'">
              <text class="card-hd">{{ msg.content }}</text>
              <view class="stats-grid">
                <view class="stat-item" v-for="(s, si) in msg.stats" :key="si">
                  <text class="stat-value" :style="{ color: s.color }">{{ s.value }}</text>
                  <text class="stat-label">{{ s.label }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="msg.role === 'user'" class="user-msg-block">
            <view class="user-msg-row">
              <view v-if="msg.sendFailed" class="msg-resend-btn" @tap.stop="resendMessage(msg)">
                <text class="msg-resend-icon">↻</text>
                <text class="msg-resend-txt">重发</text>
              </view>
              <view class="card-user" :class="{ 'send-failed': msg.sendFailed }">
                <view
                  v-if="msg.isVoice && msg.voiceUrl"
                  class="voice-bubble"
                  @tap="playVoice(msg)"
                >
                  <text class="voice-play-icon">{{ isPlayingVoice(msg) ? '⏸' : '▶' }}</text>
                  <view class="voice-wave">
                    <view class="wave-bar" v-for="n in 4" :key="n" :class="{ active: isPlayingVoice(msg) }"></view>
                  </view>
                  <text class="voice-text">{{ formatVoiceLabel(msg) }}</text>
                </view>
                <text v-else class="user-txt">{{ msg.content }}</text>
              </view>
            </view>
          </view>
          <view v-if="msg.role === 'user'" class="user-avatar">
            <image
              v-if="userAvatar"
              :src="userAvatar"
              class="user-avatar-img"
              mode="aspectFill"
            />
            <text v-else style="font-size:36rpx;color:#4facfe;">👤</text>
          </view>
        </view>
      </view>
    </scroll-view>


    <view class="input-card">
      <view class="input-row">
        <!-- 文字输入 -->
        <input
          v-if="inputMode === 'text'"
          class="inp"
          v-model="inputText"
          type="text"
          placeholder="输入计划..."
          placeholder-class="inp-ph"
          confirm-type="send"
          :adjust-position="false"
          :cursor-spacing="24"
          :focus="inputFocus"
          :disabled="sending"
          @confirm="onSend"
          @focus="onInputFocus"
          @blur="onInputBlur"
          @compositionstart="composing = true"
          @compositionend="composing = false"
        />
        <!-- 语音输入 -->
        <view
          v-else
          class="voice-area"
          :class="{ recording: voicePanelActive }"
          @touchstart.stop.prevent="onVoiceTouchStart"
          @touchmove.stop.prevent="onVoiceTouchMove"
          @touchend.stop.prevent="onVoiceTouchEnd"
          @touchcancel.stop.prevent="onVoiceTouchEnd"
        >
          <text class="voice-tip" :class="{ recording: voicePanelActive }">按住 说话</text>
        </view>

        <view class="input-actions">
          <view class="inp-btn" @tap="toggleMode">
            <text v-if="inputMode === 'text'" class="inp-btn-icon">🎤</text>
            <text v-else class="inp-btn-icon">⌨</text>
          </view>
          <view
            v-if="inputMode === 'text'"
            class="inp-send"
            :class="{ active: inputText.length > 0 && !sending, busy: sending }"
            @tap.stop.prevent="onSend"
          >
            <text class="inp-send-txt">{{ sending ? '处理中…' : '发送' }}</text>
          </view>
          <view class="inp-btn" @tap="showAddMenu">
            <text class="inp-btn-icon inp-btn-plus">＋</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 按住说话浮层（上滑取消，参考微信） -->
    <view
      v-if="voicePanelActive"
      class="voice-record-mask"
      @touchmove.stop.prevent="onVoiceTouchMove"
      @touchend.stop.prevent="onVoiceTouchEnd"
      @touchcancel.stop.prevent="onVoiceTouchEnd"
    >
      <view class="voice-record-cancel-zone" :class="{ active: voiceWillCancel }">
        <view class="voice-cancel-icon-wrap">
          <text class="voice-cancel-icon">{{ voiceWillCancel ? '↩' : '↑' }}</text>
        </view>
        <text class="voice-cancel-hint">{{ voiceWillCancel ? '松开手指，取消发送' : '上滑取消' }}</text>
      </view>
      <view class="voice-record-bubble" :class="{ cancel: voiceWillCancel }">
        <view class="voice-wave-bars">
          <view v-for="n in 5" :key="n" class="voice-wave-bar" :style="{ animationDelay: (n * 0.1) + 's' }"></view>
        </view>
      </view>
      <text class="voice-record-tip">{{ voiceWillCancel ? '松开手指，取消发送' : '松开 发送' }}</text>
    </view>

    <!-- 历史会话 -->
    <view class="history-mask" v-if="historyVisible" @tap="historyVisible = false">
      <view class="history-panel" @tap.stop>
        <view class="history-hd">
          <text class="history-title">对话历史</text>
          <view class="history-new" @tap="createNewSession">
            <text class="history-new-txt">＋ 新对话</text>
          </view>
        </view>
        <scroll-view
          class="history-scroll"
          scroll-y
          :show-scrollbar="false"
          :refresher-enabled="true"
          :refresher-triggered="sessionsRefreshing"
          @refresherrefresh="onSessionsRefresh"
          @scrolltolower="loadMoreSessions"
        >
          <view v-if="sessionList.length === 0 && !loadingSessions" class="history-empty">
            <text class="history-empty-txt">暂无历史对话</text>
          </view>
          <view
            v-for="s in sessionList"
            :key="s.id"
            class="history-item"
            :class="{ active: String(s.id) === String(sessionId) }"
            @tap="loadSession(s.id)"
          >
            <text class="history-item-title">{{ s.title || '新对话' }}</text>
            <text class="history-item-meta">
              {{ formatSessionTime(s.updatedAt) }}
              <text v-if="isSessionCached(s.id)" class="history-local"> · 本地</text>
            </text>
          </view>
          <view v-if="loadingSessions" class="history-loading">
            <text class="history-loading-txt">加载中...</text>
          </view>
          <view v-else-if="!sessionsHasNext && sessionList.length > 0" class="history-loading">
            <text class="history-loading-txt">没有更多了</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 附件菜单弹窗 -->
    <view class="add-mask" v-if="addVisible" @tap="addVisible = false">
      <view class="add-panel" @tap.stop>
        <view class="add-item" v-for="a in addOptions" :key="a.key" @tap="onAdd(a.key)">
          <view class="add-icon-box" :style="{ background: a.bg }">
            <text style="font-size:36rpx;color:#7b6df0;">🖼️</text>
          </view>
          <text class="add-label">{{ a.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getAccessToken, sendChatMessage, transcribeAudio, getUserInfo,
  getChatSessions, fetchAllChatMessages, resolveMediaUrl, BASE_URL,
  getPlanProposal, getPlanProposalsBySession, confirmPlanProposal, rejectPlanProposal,
  getGrowthTasksByDate, getGrowthTasksToday
} from '../../utils/api.js'
import { store, refreshUnreadCount } from '../../utils/store.js'
import { onChatReply } from '../../utils/realtime.js'
import {
  isSessionCached, getCachedSession, setCachedSession,
  saveCurrentSessionId, getCurrentSessionId, clearCurrentSessionId,
  getSessionRoundActions, saveSessionRoundAction
} from '../../utils/chatHistory.js'
import {
  isReminderRoundAction, createReminderActionMessage, shouldFetchReminderTasks,
  extractRoundActionFromApiMessage
} from '../../utils/reminderAction.js'
import {
  parseReminderTargetDate, mapAssistantTasksForDayResponse
} from '../../utils/assistantTaskDisplay.js'

const loaded = ref(false)
const statusBarHeight = ref(20)
const scrollTop = ref(0)
const inputText = ref('')
const inputMode = ref('voice')
const inputFocus = ref(false)
const isRecording = ref(false)
const voicePanelActive = ref(false)
const voiceWillCancel = ref(false)
const addVisible = ref(false)
const recordTimer = ref(null)
const sessionId = ref(null)
const sending = ref(false)
const SEND_DEBOUNCE_MS = 600
let lastSendFingerprint = ''
let lastSendAt = 0
let inFlightFingerprint = ''
/** 历史接口未带 roundAction 时，用 chat 响应暂存 */
const roundActionByMsgId = {}
let chatReloadSuppress = null
const userAvatar = ref('')
const composing = ref(false)
const historyVisible = ref(false)
const sessionList = ref([])
const loadingSession = ref(false)
const loadingSessions = ref(false)
const sessionsRefreshing = ref(false)
const sessionsPage = ref(0)
const sessionsHasNext = ref(false)
const playingVoiceKey = ref(null)
const keyboardHeight = ref(0)
let keyboardHandler = null
let recorderManager = null
let innerAudioContext = null
let h5MediaRecorder = null
let isProcessingVoice = false
let touchRecording = false
let recordStarting = false
let voiceRecordCancelled = false
let voiceTouchStartY = 0
const VOICE_CANCEL_SLIDE_PX = 80
const MIN_RECORD_MS = 800

const addOptions = [
  { key: 'photo', label: '照片', bg: '#ece5ff', color: '#7b6df0' }
]

const WELCOME_MESSAGE = {
  role: 'ai', type: 'text', show: true,
  title: '你好！我是你的计划助手 👋',
  content: '你可以告诉我你的计划，我会帮你安排到日程中，让你的每一天都更高效。',
  tip: '比如：明天上午10点开会，下午去健身，晚上学习2小时'
}

function getWelcomeMessages() {
  return [{ ...WELCOME_MESSAGE }]
}

const messages = ref(getWelcomeMessages())

function openPendingSessionIfAny() {
  const pending = uni.getStorageSync('pendingOpenSessionId')
  if (!pending || !getAccessToken()) return
  uni.removeStorageSync('pendingOpenSessionId')
  loadSession(pending, true)
}

onShow(() => {
  if (getAccessToken()) {
    refreshUnreadCount()
    openPendingSessionIfAny()
  }
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  keyboardHandler = (res) => {
    keyboardHeight.value = res.height || 0
    if (keyboardHeight.value > 0) {
      nextTick(() => setTimeout(scroll, 80))
    }
  }
  uni.onKeyboardHeightChange(keyboardHandler)

  // 确保初始状态渲染后再触发入场动画
  nextTick(() => {
    setTimeout(() => { loaded.value = true }, 50)
  })

  if (getAccessToken()) {
    refreshUnreadCount()
    getUserInfo().then(res => {
      if (res.avatarUrl) {
        userAvatar.value = res.avatarUrl.replace(/^https?:\/\/[^\/]+/, BASE_URL)
      }
    }).catch(() => {})
    onChatReply((data) => {
      if (!data.sessionId) return
      if (sessionId.value && String(data.sessionId) === String(sessionId.value)) {
        if (!shouldSuppressChatReload(data.sessionId)) {
          loadSession(data.sessionId, true)
        }
      }
      if (historyVisible.value) refreshSessions()
    })
    const pending = uni.getStorageSync('pendingOpenSessionId')
    if (pending) {
      openPendingSessionIfAny()
    } else {
      const cur = getCurrentSessionId()
      if (cur) loadSession(cur, true)
    }
  }
})

onUnmounted(() => {
  if (keyboardHandler) uni.offKeyboardHeightChange(keyboardHandler)
})

function onInputFocus() {
  inputFocus.value = true
  scroll()
}

function onInputBlur() {
  inputFocus.value = false
}

function scroll() { nextTick(() => { scrollTop.value = Math.random() * 99999 }) }

function pickVoiceUrl(m) {
  if (!m) return ''
  return m.voiceUrl || m.audioUrl || (m.voiceUrls && m.voiceUrls[0]) || ''
}

function pickProposalIdFromMessage(m) {
  if (!m) return null
  if (m.proposalId != null) return m.proposalId
  if (m.planProposalId != null) return m.planProposalId
  if (m.planProposal && m.planProposal.proposalId != null) return m.planProposal.proposalId
  return null
}

function looksLikePlanDraftReply(content) {
  if (!content) return false
  return /草案|确认计划|计划草案/.test(content)
}

function createPlanProposalShell({ id, content, proposalId, status, hint }) {
  const st = status || (hint && hint.status) || 'PENDING'
  const resolved = st !== 'PENDING'
  return {
    role: 'ai',
    type: 'planProposal',
    content: content || '',
    proposalId,
    status: st,
    detail: null,
    loading: true,
    resolved,
    resultMessage: resolved ? proposalResultMessage(st, hint) : '',
    acting: false,
    show: true,
    id
  }
}

function proposalResultMessage(status, detail) {
  if (status === 'CONFIRMED') {
    return (detail && detail.planId)
      ? '计划已确认，已写入日程'
      : '计划已确认'
  }
  if (status === 'REJECTED') return '已拒绝该计划草案'
  if (status === 'EXPIRED') return '计划草案已过期'
  return proposalStatusText(status)
}

function applyProposalDetail(msg, detail) {
  msg.detail = detail
  msg.status = detail.status || msg.status
  if (detail.status === 'PENDING') {
    msg.resolved = false
    msg.resultMessage = ''
  } else {
    msg.resolved = true
    msg.resultMessage = proposalResultMessage(detail.status, detail)
  }
}

function mapApiMessage(m) {
  const role = m.role === 'USER' ? 'user' : 'ai'
  if (role === 'ai') {
    const proposalId = pickProposalIdFromMessage(m)
    if (proposalId != null) {
      return createPlanProposalShell({
        id: m.id,
        content: m.content || '',
        proposalId,
        status: (m.planProposal && m.planProposal.status) || m.proposalStatus,
        hint: m.planProposal
      })
    }
    const action = extractRoundActionFromApiMessage(m) || pickRoundAction(m, sessionId.value)
    if (isReminderRoundAction(action)) {
      rememberRoundAction(m.id, action, sessionId.value)
      const card = createReminderActionMessage({
        id: m.id,
        content: m.content || '',
        roundAction: action,
        targetDate: parseReminderTargetDate(m.content || '')
      })
      if (card) return card
    }
    return { role: 'ai', type: 'text', title: '', content: m.content || '', tip: '', show: true, id: m.id }
  }
  const voiceUrl = pickVoiceUrl(m)
  const content = m.content || ''
  const isVoice = !!voiceUrl || /^\[语音\]/.test(content)
  return {
    role: 'user',
    content,
    voiceUrl,
    isVoice,
    show: true,
    id: m.id
  }
}

function mapApiToMessages(apiData) {
  return (apiData.messages || []).map(mapApiMessage)
}

function deriveSessionTitle() {
  const userMsg = [...messages.value].reverse().find(
    m => m.role === 'user' && m.content && !m.content.includes('识别中')
  )
  if (userMsg) {
    const t = userMsg.content.replace(/^\[语音\]\s*/, '').trim()
    if (t) return t.slice(0, 40)
  }
  return '新对话'
}

const chatHeaderSubtitle = computed(() => {
  if (!sessionId.value) return '和 AI 一起规划你的每一天'
  const hit = sessionList.value.find(s => String(s.id) === String(sessionId.value))
  const raw = (hit && hit.title) || deriveSessionTitle()
  const t = String(raw || '新对话').trim()
  return t.length > 22 ? t.slice(0, 22) + '…' : t
})

function pushAiLoading() {
  removeAiLoading()
  messages.value.push({ role: 'ai', type: 'loading', show: true })
  scroll()
}

function removeAiLoading() {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].type === 'loading') {
      messages.value.splice(i, 1)
      break
    }
  }
}

function rememberRoundAction(messageId, roundAction, sid) {
  if (messageId == null || !roundAction) return
  roundActionByMsgId[String(messageId)] = roundAction
  const session = sid != null ? sid : sessionId.value
  if (session) saveSessionRoundAction(session, messageId, roundAction)
}

function loadSessionRoundActionsIntoMemory(sid) {
  Object.keys(roundActionByMsgId).forEach(k => { delete roundActionByMsgId[k] })
  Object.assign(roundActionByMsgId, getSessionRoundActions(sid))
}

function pickRoundAction(m, sid) {
  if (!m) return null
  const fromApi = extractRoundActionFromApiMessage(m)
  if (fromApi) return fromApi
  if (m.roundAction && isReminderRoundAction(m.roundAction)) return m.roundAction
  if (m.id != null && roundActionByMsgId[String(m.id)]) {
    return roundActionByMsgId[String(m.id)]
  }
  if (m.id != null && sid != null) {
    const stored = getSessionRoundActions(sid)
    const hit = stored[String(m.id)]
    if (hit && isReminderRoundAction(hit)) return hit
  }
  return null
}

function syncRoundActionMapFromMessages(msgs, sid) {
  const session = sid != null ? sid : sessionId.value
  ;(msgs || []).forEach(m => {
    const action = m.roundAction && isReminderRoundAction(m.roundAction)
      ? m.roundAction
      : null
    if (m.id != null && action) rememberRoundAction(m.id, action, session)
  })
}

function suppressChatReload(sid, ms = 5000) {
  if (sid == null) return
  chatReloadSuppress = { sid: String(sid), until: Date.now() + ms }
}

function shouldSuppressChatReload(sid) {
  if (!chatReloadSuppress || sid == null) return false
  if (String(sid) !== chatReloadSuppress.sid) return false
  if (Date.now() > chatReloadSuppress.until) {
    chatReloadSuppress = null
    return false
  }
  return true
}

function persistSession() {
  if (!sessionId.value || !getAccessToken()) return
  const sid = sessionId.value
  const title = deriveSessionTitle()
  const list = messages.value.filter(m => m.type !== 'loading')
  syncRoundActionMapFromMessages(list, sid)
  const roundActions = { ...getSessionRoundActions(sid) }
  list.forEach(m => {
    if (m.id != null && m.roundAction) roundActions[String(m.id)] = m.roundAction
  })
  setCachedSession(sid, {
    sessionId: sid,
    sessionTitle: title,
    messages: list,
    roundActions
  })
  saveCurrentSessionId(sid)
}

function mapSessionItem(s) {
  return {
    id: s.sessionId != null ? s.sessionId : s.id,
    title: s.title || s.sessionTitle || '新对话',
    updatedAt: s.updatedAt || s.createdAt,
    provider: s.provider,
    model: s.model
  }
}

function applySessionsPage(data, append) {
  // 后端分页字段为 items（非 content / sessions）
  const raw = data.items || data.content || data.sessions || []
  const items = raw.map(mapSessionItem)
  sessionList.value = append ? sessionList.value.concat(items) : items
  sessionsHasNext.value = !!data.hasNext
}

function onSessionsRefresh() {
  sessionsRefreshing.value = true
  refreshSessions()
}

function refreshSessions() {
  if (!getAccessToken()) return Promise.resolve()
  loadingSessions.value = true
  sessionsPage.value = 0
  return getChatSessions(0, 20).then(data => {
    applySessionsPage(data, false)
  }).catch(() => {
    uni.showToast({ title: '加载会话列表失败', icon: 'none' })
  }).finally(() => {
    loadingSessions.value = false
    sessionsRefreshing.value = false
  })
}

function loadMoreSessions() {
  if (!sessionsHasNext.value || loadingSessions.value || !getAccessToken()) return
  loadingSessions.value = true
  const page = sessionsPage.value + 1
  getChatSessions(page, 20).then(data => {
    applySessionsPage(data, true)
    sessionsPage.value = page
  }).catch(() => {
    uni.showToast({ title: '加载更多失败', icon: 'none' })
  }).finally(() => {
    loadingSessions.value = false
  })
}

/** 从本地缓存合并语音 URL（API 消息可能不含录音地址） */
function mergeCachedPlanProposals(sid, list) {
  const cached = getCachedSession(sid)
  if (!cached || !cached.messages) return list
  const byMsgId = {}
  cached.messages.forEach(m => {
    if (m.type === 'planProposal' && m.proposalId != null && m.id != null) {
      byMsgId[m.id] = m
    }
  })
  return list.map(m => {
    if (m.role !== 'ai' || m.type === 'planProposal') return m
    const hit = byMsgId[m.id]
    if (hit) return { ...hit, show: true, loading: true }
    return m
  })
}

function enrichPlanProposalsForSession(sessionId, list) {
  return getPlanProposalsBySession(sessionId).then(res => {
    const proposals = res.items || res.proposals || res.content || []
    if (!proposals.length) return list
    const next = list.slice()
    const used = new Set()
    proposals.forEach(p => {
      const pid = p.proposalId != null ? p.proposalId : p.id
      if (pid == null) return
      let idx = next.findIndex((m, i) =>
        !used.has(i) && m.role === 'ai' && (m.id === p.assistantMessageId || m.id === p.messageId)
      )
      if (idx < 0) {
        idx = next.findIndex((m, i) =>
          !used.has(i) && m.role === 'ai' && m.type === 'text' && looksLikePlanDraftReply(m.content)
        )
      }
      if (idx < 0) return
      used.add(idx)
      next[idx] = createPlanProposalShell({
        id: next[idx].id,
        content: next[idx].content || '',
        proposalId: pid,
        status: p.status,
        hint: p
      })
    })
    return next
  }).catch(() => list)
}

function hydratePlanProposalMessages(list) {
  const jobs = list.map(msg => {
    if (msg.type !== 'planProposal' || msg.proposalId == null) return Promise.resolve()
    msg.loading = true
    return getPlanProposal(msg.proposalId)
      .then(detail => applyProposalDetail(msg, detail))
      .catch(() => {
        if (!msg.detail && msg.status && msg.status !== 'PENDING') {
          msg.resolved = true
          msg.resultMessage = proposalResultMessage(msg.status, null)
        }
      })
      .finally(() => { msg.loading = false })
  })
  return Promise.all(jobs).then(() => list)
}

/** 历史消息无 roundAction 时：用本地缓存 + 已存 roundActions 还原提醒卡片 */
function applyRoundActionsToMessages(sid, uiMessages) {
  const cached = getCachedSession(sid)
  const cardById = {}
  if (cached && cached.messages) {
    cached.messages.forEach(m => {
      if (m.type === 'reminderAction' && m.id != null) cardById[m.id] = m
    })
  }
  const stored = getSessionRoundActions(sid)

  return uiMessages.map(m => {
    if (m.role !== 'ai') return m
    let action = m.roundAction && isReminderRoundAction(m.roundAction) ? m.roundAction : null
    if (!action) action = pickRoundAction(m, sid)
    if (!action && m.id != null) action = stored[String(m.id)]
    if (!isReminderRoundAction(action)) return m

    if (m.id != null) rememberRoundAction(m.id, action, sid)

    if (m.type === 'reminderAction') {
      return { ...m, roundAction: action, show: true }
    }

    const hit = m.id != null ? cardById[m.id] : null
    if (hit) {
      return {
        ...hit,
        content: m.content || hit.content,
        roundAction: action,
        show: true,
        tasksLoading: true,
        tasksLoaded: false
      }
    }

    const card = createReminderActionMessage({
      id: m.id,
      content: m.content || '',
      roundAction: action,
      targetDate: parseReminderTargetDate(m.content || '')
    })
    return card || m
  })
}

function mergeVoiceFromCache(sid, uiMessages) {
  const cached = getCachedSession(sid)
  if (!cached || !cached.messages) return uiMessages
  const voiceById = {}
  const voiceByContent = []
  cached.messages.forEach(m => {
    if (!m.voiceUrl) return
    if (m.id != null) voiceById[m.id] = m.voiceUrl
    else if (m.content) voiceByContent.push({ content: m.content, voiceUrl: m.voiceUrl })
  })
  return uiMessages.map(m => {
    if (m.role !== 'user' || m.voiceUrl) return m
    let voiceUrl = m.id != null ? voiceById[m.id] : ''
    if (!voiceUrl && m.content) {
      const hit = voiceByContent.find(v => v.content === m.content)
      if (hit) voiceUrl = hit.voiceUrl
    }
    if (!voiceUrl) return m
    return { ...m, voiceUrl, isVoice: true }
  })
}

function formatMinutes(m) {
  if (m == null || m === '') return ''
  const n = Number(m)
  if (isNaN(n)) return ''
  if (n >= 60) {
    const h = Math.floor(n / 60)
    const rest = n % 60
    return rest ? h + '小时' + rest + '分钟' : h + '小时'
  }
  return n + '分钟'
}

function formatPlanDate(iso) {
  if (!iso) return ''
  const s = String(iso).slice(0, 10)
  const p = s.split('-')
  if (p.length >= 3) return parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日'
  return s
}

function formatPlanExpire(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = n => (n < 10 ? '0' + n : '' + n)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function proposalStatusText(status) {
  const map = {
    PENDING: '待确认',
    CONFIRMED: '已确认',
    REJECTED: '已拒绝',
    EXPIRED: '已过期'
  }
  return map[status] || status || ''
}

function appendPlanProposalMessage(res) {
  const hint = res.planProposal || {}
  const msg = createPlanProposalShell({
    id: res.assistantMessageId,
    content: res.reply || '',
    proposalId: hint.proposalId,
    status: hint.status,
    hint
  })
  messages.value.push(msg)
  return getPlanProposal(msg.proposalId).then(detail => {
    applyProposalDetail(msg, detail)
  }).catch(() => {
    msg.detail = {
      goalTitle: hint.goalTitle || '计划草案',
      goalDescription: hint.summary || '',
      summary: hint.summary || '',
      startDate: hint.startDate,
      endDate: hint.endDate,
      dailyReminderTime: hint.dailyReminderTime,
      days: []
    }
    uni.showToast({ title: '加载计划详情失败', icon: 'none' })
  }).finally(() => {
    msg.loading = false
  })
}

function onConfirmProposal(msg) {
  if (msg.resolved || msg.acting || msg.status !== 'PENDING') return
  msg.acting = 'confirm'
  confirmPlanProposal(msg.proposalId).then(res => {
    return getPlanProposal(msg.proposalId).then(detail => {
      applyProposalDetail(msg, detail)
      if (res.message) msg.resultMessage = res.message
      uni.showToast({ title: '计划已确认', icon: 'success' })
      persistSession()
    })
  }).catch(e => {
    uni.showToast({ title: (e && e.message) || '确认失败', icon: 'none' })
  }).finally(() => {
    msg.acting = false
  })
}

function onRejectProposal(msg) {
  if (msg.resolved || msg.acting || msg.status !== 'PENDING') return
  uni.showModal({
    title: '拒绝计划',
    content: '确定拒绝这份计划草案吗？拒绝后不会创建任务与提醒。',
    success: (r) => {
      if (!r.confirm) return
      msg.acting = 'reject'
      rejectPlanProposal(msg.proposalId).then(() => {
        msg.resolved = true
        msg.status = 'REJECTED'
        msg.resultMessage = '已拒绝该计划草案'
        uni.showToast({ title: '已拒绝', icon: 'none' })
        persistSession()
      }).catch(e => {
        uni.showToast({ title: (e && e.message) || '操作失败', icon: 'none' })
      }).finally(() => {
        msg.acting = false
      })
    }
  })
}

function formatDateYmdLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function reminderCardTasksTitle(msg) {
  const d = msg.targetDate
  let dateLabel = ''
  if (d) {
    const p = String(d).slice(0, 10).split('-')
    if (p.length >= 3) dateLabel = `${parseInt(p[1], 10)}月${parseInt(p[2], 10)}日`
  }
  const prefix = msg.roundAction === 'REMINDER_QUERIED' ? '当日提醒' : '当日相关提醒'
  return dateLabel ? `${prefix} · ${dateLabel}` : prefix
}

function reminderStatusChip(msg) {
  const map = {
    created: '新增',
    updated: '修改',
    deleted: '删除',
    completed: '完成',
    queried: '查询'
  }
  return map[msg && msg.variant] || ''
}

/** 提醒卡片对应计划日（与 hydrate 拉任务逻辑一致） */
function reminderPlanDate(msg) {
  if (!msg) return formatDateYmdLocal()
  return msg.targetDate || parseReminderTargetDate(msg.content || '') || formatDateYmdLocal()
}

function normalizePlanNavigateDate(date) {
  if (!date) return ''
  const s = String(date).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

function hydrateReminderActionCard(msg) {
  if (!msg || !shouldFetchReminderTasks(msg.roundAction)) {
    if (msg) {
      msg.tasksLoading = false
      msg.tasksLoaded = true
    }
    return Promise.resolve()
  }
  const targetDate = msg.targetDate || parseReminderTargetDate(msg.content)
  msg.targetDate = targetDate
  msg.tasksLoading = true
  msg.tasksError = false
  const today = formatDateYmdLocal()
  const loader = targetDate === today ? getGrowthTasksToday() : getGrowthTasksByDate(targetDate)
  return loader
    .then(res => {
      msg.tasks = mapAssistantTasksForDayResponse(res, msg.roundAction)
      msg.tasksError = false
    })
    .catch(() => {
      msg.tasks = []
      msg.tasksError = true
    })
    .finally(() => {
      msg.tasksLoading = false
      msg.tasksLoaded = true
    })
}

function hydrateAllReminderActionMessages(list) {
  const jobs = (list || messages.value)
    .filter(m => m.type === 'reminderAction' && shouldFetchReminderTasks(m.roundAction) && !m.tasksLoaded)
    .map(m => hydrateReminderActionCard(m))
  return Promise.all(jobs)
}

function appendAiReplyMessage(res) {
  if (res.planProposal && res.planProposal.proposalId != null) {
    return appendPlanProposalMessage(res)
  }
  const action = res.roundAction || res.round_action
  if (isReminderRoundAction(action)) {
    rememberRoundAction(res.assistantMessageId, action, res.sessionId)
    const card = createReminderActionMessage({
      id: res.assistantMessageId,
      content: res.reply || '',
      roundAction: action,
      targetDate: parseReminderTargetDate(res.reply || '')
    })
    if (card) {
      messages.value.push(card)
      persistSession()
      return hydrateReminderActionCard(card).then(() => {
        persistSession()
      })
    }
  }
  messages.value.push({
    role: 'ai',
    type: 'text',
    title: '',
    content: res.reply,
    tip: '',
    show: true,
    id: res.assistantMessageId
  })
  return Promise.resolve()
}

function onChatSuccess(res) {
  removeAiLoading()
  sessionId.value = res.sessionId
  suppressChatReload(res.sessionId)
  appendAiReplyMessage(res).then(() => {
    persistSession()
    scroll()
  })
}

function formatSessionTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const pad = n => (n < 10 ? '0' + n : '' + n)
  if (isToday) return pad(d.getHours()) + ':' + pad(d.getMinutes())
  return (d.getMonth() + 1) + '/' + d.getDate()
}

function formatVoiceLabel(msg) {
  const t = (msg.content || '').replace(/^\[语音\]\s*/, '').trim()
  return t || '语音消息'
}

function voiceMsgKey(msg) {
  return msg.id != null ? 'id-' + msg.id : 'url-' + (msg.voiceUrl || '')
}

function isPlayingVoice(msg) {
  return playingVoiceKey.value === voiceMsgKey(msg)
}

function getInnerAudio() {
  if (!innerAudioContext) {
    innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.onEnded(() => { playingVoiceKey.value = null })
    innerAudioContext.onStop(() => { playingVoiceKey.value = null })
    innerAudioContext.onError(() => {
      playingVoiceKey.value = null
      uni.showToast({ title: '无法播放语音', icon: 'none' })
    })
  }
  return innerAudioContext
}

function playVoice(msg) {
  const url = resolveMediaUrl(msg.voiceUrl)
  if (!url) {
    uni.showToast({ title: '语音文件不可用', icon: 'none' })
    return
  }
  const key = voiceMsgKey(msg)
  const audio = getInnerAudio()
  if (playingVoiceKey.value === key) {
    audio.stop()
    playingVoiceKey.value = null
    return
  }
  playingVoiceKey.value = key
  audio.src = url
  audio.play()
}

function openHistory() {
  if (!getAccessToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 800)
    return
  }
  historyVisible.value = true
  refreshSessions()
}

function createNewSession() {
  if (innerAudioContext) innerAudioContext.stop()
  playingVoiceKey.value = null
  sessionId.value = null
  clearCurrentSessionId()
  inFlightFingerprint = ''
  messages.value = getWelcomeMessages()
  historyVisible.value = false
  scroll()
}

function buildSendFingerprint(text) {
  return `${sessionId.value || 'new'}::${text}`
}

/** 统一提交聊天：防连点；失败仅标记用户消息可手动重发，不自动重试 */
function submitChat(text, options = {}) {
  const { fromVoice = false, resendMsg = null } = options
  if (composing.value) return false

  const t = (text || '').trim()
  if (!t) return false

  const now = Date.now()
  const fp = buildSendFingerprint(t)
  const isResend = !!resendMsg

  if (sending.value) {
    if (fp === inFlightFingerprint) {
      uni.showToast({ title: '上一条还在处理中，请稍候', icon: 'none' })
    }
    return false
  }
  if (!isResend && fp === lastSendFingerprint && now - lastSendAt < SEND_DEBOUNCE_MS) {
    return false
  }

  let userMsg = resendMsg || null
  if (!fromVoice && !resendMsg) {
    userMsg = {
      role: 'user',
      content: t,
      show: true,
      clientId: 'u-' + Date.now(),
      sendFailed: false,
      resendPayload: { text: t, fromVoice: false }
    }
    messages.value.push(userMsg)
    inputText.value = ''
    scroll()
  } else if (resendMsg) {
    userMsg = resendMsg
    userMsg.sendFailed = false
    userMsg.resendPayload = { text: t, fromVoice: !!fromVoice }
  } else if (fromVoice) {
    userMsg = [...messages.value].reverse().find(m => m.role === 'user') || null
    if (userMsg) {
      userMsg.sendFailed = false
      userMsg.resendPayload = { text: t, fromVoice: true }
    }
  }

  sending.value = true
  inFlightFingerprint = fp
  lastSendFingerprint = fp
  lastSendAt = now

  pushAiLoading()
  sendChatMessage(t, sessionId.value || undefined).then(res => {
    if (userMsg) {
      userMsg.sendFailed = false
      userMsg.sendError = ''
    }
    onChatSuccess(res)
  }).catch((e) => {
    removeAiLoading()
    if (e && e.code === 'UNAUTHORIZED') {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 800)
    } else if (userMsg) {
      userMsg.sendFailed = true
      userMsg.sendError = (e && e.message) || '发送失败'
      userMsg.resendPayload = { text: t, fromVoice: !!fromVoice }
    }
  }).finally(() => {
    sending.value = false
    inFlightFingerprint = ''
  })

  return true
}

function resendMessage(msg) {
  if (!msg || !msg.resendPayload || sending.value) return
  submitChat(msg.resendPayload.text, {
    fromVoice: !!msg.resendPayload.fromVoice,
    resendMsg: msg
  })
}

function loadSession(sid, silent) {
  if (String(sid) === String(sessionId.value) && !silent) {
    historyVisible.value = false
    return Promise.resolve()
  }
  if (loadingSession.value) return Promise.resolve()
  loadingSession.value = true
  if (!silent) historyVisible.value = false
  if (innerAudioContext) innerAudioContext.stop()
  playingVoiceKey.value = null

  sessionId.value = sid
  saveCurrentSessionId(sid)
  loadSessionRoundActionsIntoMemory(sid)

  // 始终走图2接口拉消息；本地缓存用于语音 URL、roundAction 提醒卡片
  return fetchAllChatMessages(sid)
    .then(data => {
      let list = mapApiToMessages(data)
      list = mergeVoiceFromCache(sid, list)
      list = applyRoundActionsToMessages(sid, list)
      list = mergeCachedPlanProposals(sid, list)
      return enrichPlanProposalsForSession(sid, list).then(enriched => ({ data, list: enriched }))
    })
    .then(({ data, list }) => hydratePlanProposalMessages(list).then(() => ({ data, list })))
    .then(({ data, list }) => hydrateAllReminderActionMessages(list).then(() => ({ data, list })))
    .then(({ data, list }) => {
      messages.value = list.map(m => ({ ...m, show: true }))
      syncRoundActionMapFromMessages(messages.value, sid)
      const title = data.sessionTitle || deriveSessionTitle()
      const roundActions = { ...getSessionRoundActions(sid) }
      messages.value.forEach(m => {
        if (m.id != null && m.roundAction) roundActions[String(m.id)] = m.roundAction
      })
      setCachedSession(sid, {
        sessionId: data.sessionId || sid,
        sessionTitle: title,
        messages: messages.value,
        roundActions
      })
      scroll()
    }).catch(() => {
    if (!silent) uni.showToast({ title: '加载历史失败', icon: 'none' })
    messages.value = getWelcomeMessages()
    sessionId.value = null
    clearCurrentSessionId()
  }).finally(() => {
    loadingSession.value = false
  })
}

const PLANS_NAV_DATE_KEY = 'plans_navigate_date'

function goPlans(date) {
  const d = normalizePlanNavigateDate(date)
  if (d) {
    try {
      uni.setStorageSync(PLANS_NAV_DATE_KEY, d)
    } catch (e) { /* ignore */ }
  }
  const url = d ? `/pages/plans/plans?date=${encodeURIComponent(d)}` : '/pages/plans/plans'
  uni.navigateTo({ url })
}

function goNotifications() {
  uni.navigateTo({ url: '/pages/notifications/notifications' })
}

function goTasks() {
  uni.navigateTo({ url: '/pages/tasks/tasks' })
}

function goLogin() {
  const token = getAccessToken()
  if (token) {
    uni.navigateTo({ url: '/pages/profile/profile' })
  } else {
    uni.navigateTo({ url: '/pages/login/login' })
  }
}

function toggleMode() {
  inputMode.value = inputMode.value === 'text' ? 'voice' : 'text'
  if (inputMode.value === 'text') {
    inputFocus.value = true
  }
}

function onSend() {
  submitChat(inputText.value)
}

let recordStartTime = 0
let lastVoiceBlobUrl = null

function ensureRecordPermission() {
  return new Promise((resolve, reject) => {
    const sys = uni.getSystemInfoSync()
    if (sys.platform === 'android' && typeof plus !== 'undefined' && plus.android) {
      plus.android.requestPermissions(
        ['android.permission.RECORD_AUDIO'],
        (e) => {
          if (e.granted && e.granted.length > 0) resolve()
          else reject(new Error('denied'))
        },
        reject
      )
      return
    }
    if (sys.uniPlatform === 'mp-weixin') {
      uni.authorize({
        scope: 'scope.record',
        success: () => resolve(),
        fail: () => reject(new Error('denied'))
      })
      return
    }
    resolve()
  })
}

function initRecorderManager() {
  if (recorderManager) return
  recorderManager = uni.getRecorderManager()
  recorderManager.onStart(() => {
    console.log('recorderManager onStart')
    isRecording.value = true
  })
  recorderManager.onStop((res) => {
    console.log('recorderManager onStop:', JSON.stringify(res))
    isRecording.value = false
    touchRecording = false
    recordStarting = false
    if (voiceRecordCancelled) {
      voiceRecordCancelled = false
      return
    }
    if (isProcessingVoice) return
    const duration = res.duration || (Date.now() - recordStartTime)
    if (duration < MIN_RECORD_MS) {
      uni.showToast({ title: '说话时间太短，请按住多说一会儿', icon: 'none' })
      return
    }
    if (res.tempFilePath) {
      isProcessingVoice = true
      handleVoiceResult(res.tempFilePath)
    } else {
      uni.showToast({ title: '未获取到录音文件', icon: 'none' })
    }
  })
  recorderManager.onError((err) => {
    console.error('recorderManager onError:', JSON.stringify(err))
    isRecording.value = false
    touchRecording = false
    recordStarting = false
    resetVoicePanel()
    uni.showToast({ title: '录音失败', icon: 'none' })
  })
}

function resetVoicePanel() {
  voicePanelActive.value = false
  voiceWillCancel.value = false
  voiceTouchStartY = 0
}

function onVoiceTouchMove(e) {
  if (!voicePanelActive.value) return
  const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
  if (!touch) return
  const dy = voiceTouchStartY - touch.clientY
  voiceWillCancel.value = dy > VOICE_CANCEL_SLIDE_PX
}

async function onVoiceTouchStart(e) {
  if (touchRecording || recordStarting || isProcessingVoice || sending.value) {
    if (sending.value) {
      uni.showToast({ title: '请等待当前消息处理完成', icon: 'none' })
    }
    return
  }
  if (!getAccessToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 800)
    return
  }

  const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
  voiceTouchStartY = touch ? touch.clientY : 0
  voiceWillCancel.value = false
  voiceRecordCancelled = false
  voicePanelActive.value = true

  touchRecording = true
  recordStarting = true
  recordStartTime = Date.now()

  try {
    await ensureRecordPermission()
    recordStarting = false
    if (!touchRecording) return
    startRecord()
  } catch (e) {
    touchRecording = false
    recordStarting = false
    resetVoicePanel()
    uni.showModal({
      title: '需要麦克风权限',
      content: '请在系统设置中允许本应用使用麦克风',
      confirmText: '知道了',
      showCancel: false
    })
  }
}

function onVoiceTouchEnd() {
  if (!voicePanelActive.value && !touchRecording && !recordStarting && !isRecording.value) return

  const cancel = voiceWillCancel.value
  resetVoicePanel()
  touchRecording = false

  if (recordStarting) {
    recordStarting = false
    if (cancel) voiceRecordCancelled = true
    return
  }
  recordStarting = false

  if (cancel) {
    voiceRecordCancelled = true
    stopRecord()
    return
  }
  stopRecord()
}

function startRecord() {
  const platform = uni.getSystemInfoSync().platform

  if (platform !== 'web') {
    try {
      initRecorderManager()
      recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      })
    } catch (e) {
      touchRecording = false
      recordStarting = false
      resetVoicePanel()
      uni.showToast({ title: '录音初始化失败', icon: 'none' })
    }
    return
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    touchRecording = false
    recordStarting = false
    resetVoicePanel()
    uni.showToast({ title: '当前环境不支持录音', icon: 'none' })
    return
  }

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    if (!touchRecording) {
      stream.getTracks().forEach(t => t.stop())
      return
    }
    const mr = new MediaRecorder(stream)
    const chunks = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstart = () => { isRecording.value = true }
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      isRecording.value = false
      touchRecording = false
      if (voiceRecordCancelled) {
        voiceRecordCancelled = false
        return
      }
      const elapsed = Date.now() - recordStartTime
      if (elapsed < MIN_RECORD_MS) {
        uni.showToast({ title: '说话时间太短，请按住多说一会儿', icon: 'none' })
        return
      }
      const blob = new Blob(chunks, { type: 'audio/webm' })
      uploadAndTranscribeBlob(blob)
    }
    mr.start()
    h5MediaRecorder = mr
  }).catch(() => {
    touchRecording = false
    recordStarting = false
    resetVoicePanel()
    uni.showToast({ title: '无法访问麦克风', icon: 'none' })
  })
}

function stopRecord() {
  if (recorderManager) {
    try { recorderManager.stop() } catch (e) { /* 可能尚未 start */ }
  } else if (h5MediaRecorder && h5MediaRecorder.state === 'recording') {
    h5MediaRecorder.stop()
  }
}

// H5 专用：XMLHttpRequest 上传音频 blob
function uploadAndTranscribeBlob(blob) {
  if (lastVoiceBlobUrl) URL.revokeObjectURL(lastVoiceBlobUrl)
  lastVoiceBlobUrl = URL.createObjectURL(blob)
  messages.value.push({
    role: 'user', content: '[语音] 识别中...', show: true,
    voiceUrl: lastVoiceBlobUrl, isVoice: true
  })
  scroll()

  const form = new FormData()
  form.append('file', blob, 'speech.webm')

  const token = getAccessToken()
  const xhr = new XMLHttpRequest()
  xhr.open('POST', BASE_URL + '/api/v1/speech/transcribe')
  xhr.setRequestHeader('Authorization', 'Bearer ' + token)
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const res = JSON.parse(xhr.responseText)
        onTranscribeSuccess(res.text)
      } catch (e) {
        uni.showToast({ title: '语音识别失败', icon: 'none' })
      }
    } else if (xhr.status === 401) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 800)
    } else {
      try {
        const err = JSON.parse(xhr.responseText)
        uni.showToast({ title: err.message || '语音识别失败', icon: 'none' })
      } catch (e) {
        uni.showToast({ title: '语音识别失败', icon: 'none' })
      }
    }
  }
  xhr.onerror = function () {
    uni.showToast({ title: '网络连接失败', icon: 'none' })
  }
  xhr.send(form)
}

function handleVoiceResult(filePath) {
  console.log('handleVoiceResult filePath:', filePath)
  messages.value.push({
    role: 'user', content: '[语音] 识别中...', show: true,
    voiceUrl: filePath, isVoice: true
  })
  scroll()

  transcribeAudio(filePath).then(res => {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'user' && (res.audioUrl || res.voiceUrl || res.url)) {
      last.voiceUrl = res.audioUrl || res.voiceUrl || res.url
      last.isVoice = true
    }
    onTranscribeSuccess(res.text || '')
  }).catch((e) => {
    if (e && e.code === 'UNAUTHORIZED') {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 800)
    } else {
      uni.showToast({ title: e.message || '语音识别失败', icon: 'none' })
    }
  }).finally(() => {
    isProcessingVoice = false
  })
}

function onTranscribeSuccess(text) {
  if (!text) {
    messages.value.push({ role: 'ai', type: 'text', title: '', content: '未识别到内容，请重试', tip: '', show: true })
    scroll()
    return
  }
  const lastUserMsg = messages.value[messages.value.length - 1]
  if (lastUserMsg && lastUserMsg.role === 'user') {
    lastUserMsg.content = '[语音] ' + text
    if (!lastUserMsg.voiceUrl && lastVoiceBlobUrl) lastUserMsg.voiceUrl = lastVoiceBlobUrl
    lastUserMsg.isVoice = true
  }
  scroll()
  submitChat(text, { fromVoice: true })
}

function showAddMenu() {
  addVisible.value = true
}

function onAdd(key) {
  addVisible.value = false
  uni.showToast({ title: '已选择照片', icon: 'none' })
}


</script>

<style src="../../styles/ai-reply-loading.css"></style>

<style scoped>
page { height: 100%; background: linear-gradient(180deg, #e8f4fd 0%, #f0f7ff 40%, #ffffff 100%); }

.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #e8f4fd 0%, #f0f7ff 40%, #ffffff 100%);
  box-sizing: border-box;
}

/* 动画 */
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

.chat-header.show { opacity: 1; transform: translateY(0); }
.msg-item.show { opacity: 1; transform: none; }

/* 聊天页顶栏 */
.chat-header {
  position: relative;
  flex-shrink: 0;
  z-index: 20;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, #f4faff 48%, #eaf5ff 100%);
  border-bottom: 1rpx solid rgba(79, 172, 254, 0.14);
  box-shadow: 0 8rpx 28rpx rgba(79, 172, 254, 0.08);
  opacity: 0;
  transform: translateY(-8rpx);
  transition: opacity 0.28s ease-out, transform 0.28s ease-out;
}
.chat-header-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.chat-header-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2rpx);
}
.chat-header-orb--1 {
  width: 200rpx;
  height: 200rpx;
  top: -80rpx;
  right: -40rpx;
  background: radial-gradient(circle, rgba(79, 172, 254, 0.22) 0%, transparent 70%);
}
.chat-header-orb--2 {
  width: 140rpx;
  height: 140rpx;
  bottom: -50rpx;
  left: -20rpx;
  background: radial-gradient(circle, rgba(123, 109, 240, 0.12) 0%, transparent 72%);
}
.chat-header-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 12rpx 28rpx 8rpx;
}
.chat-brand {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.chat-brand-mark {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #4facfe 0%, #6cb4ee 55%, #7b6df0 100%);
  box-shadow: 0 6rpx 18rpx rgba(79, 172, 254, 0.32);
}
.chat-brand-letter {
  font-size: 26rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1rpx;
}
.chat-brand-copy {
  flex: 1;
  min-width: 0;
}
.chat-brand-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
  letter-spacing: 0.5rpx;
}
.chat-brand-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chat-header-tools {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.chat-tool-btn {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(79, 172, 254, 0.18);
  box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.06);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.chat-tool-btn--avatar {
  padding: 0;
  overflow: hidden;
}
.chat-tool-avatar {
  width: 100%;
  height: 100%;
}
.chat-tool-icon {
  position: relative;
}
.chat-tool-icon--bell {
  width: 28rpx;
  height: 28rpx;
}
.chat-tool-icon--bell::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 2rpx;
  width: 14rpx;
  height: 12rpx;
  margin-left: -7rpx;
  border: 3rpx solid #4facfe;
  border-bottom: none;
  border-radius: 8rpx 8rpx 0 0;
  box-sizing: border-box;
}
.chat-tool-icon--bell::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2rpx;
  width: 6rpx;
  height: 6rpx;
  margin-left: -3rpx;
  border-radius: 50%;
  background: #4facfe;
}
.chat-tool-icon--user {
  width: 28rpx;
  height: 28rpx;
}
.chat-tool-icon--user::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 2rpx;
  width: 12rpx;
  height: 12rpx;
  margin-left: -6rpx;
  border-radius: 50%;
  background: #4facfe;
}
.chat-tool-icon--user::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 22rpx;
  height: 11rpx;
  margin-left: -11rpx;
  border-radius: 12rpx 12rpx 0 0;
  background: #4facfe;
}
.chat-tool-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #ff4757;
  border: 2rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.chat-tool-badge-txt {
  font-size: 18rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.chat-quick-scroll {
  position: relative;
  z-index: 1;
  width: 100%;
  white-space: nowrap;
}
.chat-quick-row {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
  padding: 4rpx 28rpx 18rpx;
}
.chat-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 2rpx 10rpx rgba(15, 23, 42, 0.04);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.chat-action-chip--primary {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  border-color: transparent;
  box-shadow: 0 6rpx 16rpx rgba(79, 172, 254, 0.28);
}
.chat-action-chip--primary .chat-chip-label {
  color: #fff;
  font-weight: 600;
}
.chat-action-chip--primary .chat-chip-icon--plus::before,
.chat-action-chip--primary .chat-chip-icon--plus::after {
  background: #fff;
}
.chat-chip-label {
  font-size: 24rpx;
  color: #475569;
  font-weight: 500;
  line-height: 1.2;
}
.chat-chip-icon {
  width: 28rpx;
  height: 28rpx;
  position: relative;
  flex-shrink: 0;
}
.chat-chip-icon--history::before,
.chat-chip-icon--history::after,
.chat-chip-icon--history {
  box-sizing: border-box;
}
.chat-chip-icon--history::before {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 6rpx;
  width: 18rpx;
  height: 14rpx;
  border: 3rpx solid #4facfe;
  border-radius: 4rpx;
}
.chat-chip-icon--history::after {
  content: '';
  position: absolute;
  left: 10rpx;
  top: 2rpx;
  width: 6rpx;
  height: 6rpx;
  border-top: 3rpx solid #4facfe;
  border-right: 3rpx solid #4facfe;
  transform: rotate(-45deg);
}
.chat-chip-icon--plus::before,
.chat-chip-icon--plus::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #4facfe;
  border-radius: 2rpx;
}
.chat-chip-icon--plus::before {
  width: 16rpx;
  height: 3rpx;
  margin-left: -8rpx;
  margin-top: -1.5rpx;
}
.chat-chip-icon--plus::after {
  width: 3rpx;
  height: 16rpx;
  margin-left: -1.5rpx;
  margin-top: -8rpx;
}
.chat-chip-icon--plan::before {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 4rpx;
  width: 20rpx;
  height: 18rpx;
  border: 3rpx solid #4facfe;
  border-radius: 4rpx;
  box-sizing: border-box;
}
.chat-chip-icon--plan::after {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 10rpx;
  width: 20rpx;
  height: 3rpx;
  background: #4facfe;
}

@media (prefers-reduced-motion: reduce) {
  .chat-header {
    transition: opacity 0.2s ease-out;
    transform: none;
  }
}

/* 聊天 */
.chat-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  padding: 0 24rpx 16rpx;
  box-sizing: border-box;
}
.msg-list { padding-bottom: 14rpx; }
.msg-item {
  margin-bottom: 14rpx;
  opacity: 0;
  transition: opacity 0.3s ease-out;
}
.align-left { display: flex; justify-content: flex-start; align-items: flex-start; gap: 12rpx; }
.align-right { display: flex; justify-content: flex-end; align-items: flex-start; gap: 12rpx; }

.user-msg-block {
  max-width: 88%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.user-msg-row {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 12rpx;
}
.msg-resend-btn {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 12rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(255, 77, 79, 0.45);
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.12);
}
.msg-resend-icon {
  font-size: 28rpx;
  color: #ff4d4f;
  line-height: 1;
}
.msg-resend-txt {
  font-size: 20rpx;
  color: #ff4d4f;
  margin-top: 2rpx;
}
.card-user.send-failed {
  opacity: 0.88;
  box-shadow: 0 0 0 2rpx rgba(255, 77, 79, 0.35), 0 4rpx 16rpx rgba(79, 172, 254, 0.2);
}

.card-ai {
  background: #fff; border-radius: 16rpx; padding: 22rpx; max-width: 88%;
  box-shadow: 0 2rpx 10rpx rgba(79,172,254,0.06);
  overflow: visible;
}
.ai-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #e8f4fd, #d4ecff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(79,172,254,0.12);
}
.ai-hd { display: block; font-size: 28rpx; font-weight: 600; color: #222; margin-bottom: 10rpx; }
.ai-bd { display: block; width: 100%; font-size: 24rpx; color: #555; line-height: 1.8; }
.ai-tip { display: block; font-size: 24rpx; color: #99c4e8; line-height: 1.8; margin-top: 4rpx; }

.card-user {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  border-radius: 24rpx 24rpx 6rpx 24rpx;
  padding: 20rpx 26rpx;
  max-width: 76%;
  box-shadow: 0 4rpx 16rpx rgba(79,172,254,0.2);
  word-break: break-all;
}
.user-txt { font-size: 27rpx; color: #fff; line-height: 1.7; word-break: break-all; }

.user-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f4fd, #d4ecff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(79,172,254,0.12);
}
.user-avatar-img {
  width: 100%;
  height: 100%;
}

.card-hd { display: block; font-size: 26rpx; color: #333; line-height: 1.6; margin-bottom: 6rpx; }
.plan-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #eef5fb; }
.plan-row:last-of-type { border-bottom: none; }
.plan-l { display: flex; align-items: center; gap: 10rpx; }
.plan-nm { font-size: 26rpx; color: #333; }
.plan-tm { font-size: 24rpx; color: #99c4e8; }
.link-row { text-align: right; margin-top: 8rpx; }
.link-txt { font-size: 24rpx; color: #4facfe; }

/* 提醒操作卡片（roundAction）— 左侧色条 + 时间轴列表 */
.reminder-action-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 16rpx;
  margin: -4rpx -6rpx;
  background: #fff;
  border: 1rpx solid rgba(79, 172, 254, 0.12);
  box-shadow: 0 4rpx 18rpx rgba(15, 23, 42, 0.06);
  animation: reminderCardIn 0.32s ease-out both;
}
.reminder-rail {
  width: 8rpx;
  flex-shrink: 0;
  border-radius: 16rpx 0 0 16rpx;
}
.reminder-card-body {
  flex: 1;
  min-width: 0;
  padding: 18rpx 20rpx 16rpx;
}
.reminder-top-band {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}
.reminder-badge {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.reminder-badge-txt {
  font-size: 26rpx;
  line-height: 1;
}
.reminder-top-copy {
  flex: 1;
  min-width: 0;
  padding-top: 2rpx;
}
.reminder-top-label {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.35;
  color: #1e293b;
}
.reminder-top-sub {
  display: block;
  font-size: 22rpx;
  line-height: 1.45;
  margin-top: 4rpx;
  color: #64748b;
}
.reminder-top-chip {
  flex-shrink: 0;
  font-size: 20rpx;
  font-weight: 600;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  line-height: 1.2;
  margin-top: 4rpx;
}
.reminder-copy-panel {
  margin-top: 14rpx;
  padding: 14rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
}
.reminder-copy-md {
  display: block;
  font-size: 24rpx;
  line-height: 1.75;
  color: #475569;
}
.reminder-sync-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  padding: 12rpx 0 4rpx;
}
.reminder-sync-spinner {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid rgba(79, 172, 254, 0.18);
  border-top-color: #4facfe;
  border-radius: 50%;
  animation: reminderTasksSpin 0.75s linear infinite;
}
.reminder-sync-txt {
  font-size: 22rpx;
  color: #64748b;
}
.reminder-schedule-block {
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 1rpx dashed rgba(148, 163, 184, 0.35);
  animation: reminderScheduleIn 0.28s ease-out both;
}
.reminder-schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.reminder-schedule-title {
  font-size: 22rpx;
  font-weight: 600;
  color: #475569;
  flex: 1;
  min-width: 0;
}
.reminder-schedule-count {
  font-size: 20rpx;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
}
.reminder-schedule-empty {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  text-align: center;
  padding: 16rpx 8rpx;
}
.reminder-timeline {
  padding-left: 4rpx;
}
.reminder-timeline-node {
  display: flex;
  gap: 14rpx;
  animation: reminderTimelineIn 0.3s ease-out both;
}
.reminder-timeline-track {
  width: 24rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.reminder-timeline-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  border: 3rpx solid #4facfe;
  background: #4facfe;
  box-sizing: border-box;
  flex-shrink: 0;
  margin-top: 18rpx;
}
.reminder-timeline-line {
  flex: 1;
  width: 2rpx;
  min-height: 20rpx;
  margin: 4rpx 0;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.45) 0%, rgba(148, 163, 184, 0.12) 100%);
}
.reminder-timeline-card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 14rpx;
  margin-bottom: 10rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
}
.reminder-timeline-time {
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 600;
  color: #64748b;
  min-width: 88rpx;
}
.reminder-timeline-time.time-due { color: #ea580c; }
.reminder-timeline-time.time-overdue { color: #94a3b8; }
.reminder-timeline-time.time-upcoming { color: #16a34a; }
.reminder-timeline-name {
  flex: 1;
  font-size: 26rpx;
  font-weight: 500;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reminder-schedule-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  margin-top: 6rpx;
  padding: 16rpx 12rpx;
  border-radius: 12rpx;
  background: rgba(79, 172, 254, 0.08);
  border: 1rpx solid rgba(79, 172, 254, 0.16);
}
.reminder-schedule-footer-txt {
  font-size: 24rpx;
  font-weight: 600;
  color: #4facfe;
}
.reminder-schedule-arrow {
  font-size: 28rpx;
  color: #4facfe;
  line-height: 1;
}

/* 各操作类型：色条 / 徽章 / 标签（色相不变，明度微调） */
.reminder-created {
  background: #f6fffb;
  border-color: rgba(34, 197, 94, 0.28);
}
.reminder-created .reminder-rail { background: linear-gradient(180deg, #4ade80, #16a34a); }
.reminder-created .reminder-badge {
  background: rgba(34, 197, 94, 0.14);
  border: 1rpx solid rgba(34, 197, 94, 0.35);
}
.reminder-created .reminder-top-label { color: #15803d; }
.reminder-created .reminder-top-chip {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
  border: 1rpx solid rgba(34, 197, 94, 0.22);
}

.reminder-updated {
  background: #fffdf5;
  border-color: rgba(245, 158, 11, 0.32);
}
.reminder-updated .reminder-rail { background: linear-gradient(180deg, #fcd34d, #d97706); }
.reminder-updated .reminder-badge {
  background: rgba(245, 158, 11, 0.14);
  border: 1rpx solid rgba(245, 158, 11, 0.35);
}
.reminder-updated .reminder-top-label { color: #b45309; }
.reminder-updated .reminder-top-chip {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border: 1rpx solid rgba(245, 158, 11, 0.25);
}

.reminder-deleted {
  background: #fffafa;
  border-color: rgba(239, 68, 68, 0.28);
}
.reminder-deleted .reminder-rail { background: linear-gradient(180deg, #fca5a5, #dc2626); }
.reminder-deleted .reminder-badge {
  background: rgba(239, 68, 68, 0.12);
  border: 1rpx solid rgba(239, 68, 68, 0.3);
}
.reminder-deleted .reminder-top-label { color: #b91c1c; }
.reminder-deleted .reminder-top-chip {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
  border: 1rpx solid rgba(239, 68, 68, 0.22);
}
.reminder-deleted .reminder-copy-md { opacity: 0.88; }

.reminder-completed {
  background: #f8fbff;
  border-color: rgba(59, 130, 246, 0.28);
}
.reminder-completed .reminder-rail { background: linear-gradient(180deg, #93c5fd, #2563eb); }
.reminder-completed .reminder-badge {
  background: rgba(59, 130, 246, 0.12);
  border: 1rpx solid rgba(59, 130, 246, 0.32);
}
.reminder-completed .reminder-top-label { color: #1d4ed8; }
.reminder-completed .reminder-top-chip {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.1);
  border: 1rpx solid rgba(59, 130, 246, 0.22);
}

.reminder-queried {
  background: #faf9ff;
  border-color: rgba(99, 102, 241, 0.28);
}
.reminder-queried .reminder-rail { background: linear-gradient(180deg, #a5b4fc, #6366f1); }
.reminder-queried .reminder-badge {
  background: rgba(99, 102, 241, 0.12);
  border: 1rpx solid rgba(99, 102, 241, 0.3);
}
.reminder-queried .reminder-top-label { color: #4338ca; }
.reminder-queried .reminder-top-chip {
  color: #4338ca;
  background: rgba(99, 102, 241, 0.1);
  border: 1rpx solid rgba(99, 102, 241, 0.22);
}

@keyframes reminderTasksSpin {
  to { transform: rotate(360deg); }
}
@keyframes reminderScheduleIn {
  from { opacity: 0; transform: translateY(6rpx); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes reminderTimelineIn {
  from { opacity: 0; transform: translateX(-8rpx); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes reminderCardIn {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .reminder-action-card,
  .reminder-schedule-block,
  .reminder-timeline-node,
  .reminder-sync-spinner {
    animation: none !important;
  }
}

/* 计划草案卡片 */
.proposal-wrap { width: 100%; }
.proposal-status-badge {
  display: inline-block; padding: 6rpx 16rpx; border-radius: 8rpx;
  margin-bottom: 12rpx; font-size: 22rpx;
}
.proposal-status-badge.status-pending { background: rgba(255,165,0,0.15); color: #e67e00; }
.proposal-status-badge.status-confirmed { background: rgba(107,203,119,0.15); color: #3d9a4a; }
.proposal-status-badge.status-rejected { background: rgba(200,200,200,0.25); color: #888; }
.proposal-status-badge.status-expired { background: rgba(150,150,150,0.15); color: #999; }
.proposal-intro { margin-bottom: 16rpx; }
.proposal-loading { padding: 24rpx 0; text-align: center; }
.proposal-loading-txt { font-size: 24rpx; color: #99c4e8; }
.proposal-body {
  background: linear-gradient(135deg, #f8fbff, #eef7ff);
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(79,172,254,0.12);
}
.proposal-title {
  display: block; font-size: 30rpx; font-weight: 600; color: #222; margin-bottom: 8rpx;
}
.proposal-desc, .proposal-summary {
  display: block; font-size: 24rpx; color: #555; line-height: 1.7; margin-bottom: 8rpx;
}
.proposal-meta {
  display: block; font-size: 22rpx; color: #4facfe; margin-bottom: 16rpx;
}
.proposal-day {
  padding: 16rpx 0;
  border-top: 1rpx solid rgba(79,172,254,0.1);
}
.proposal-day:first-of-type { border-top: none; padding-top: 0; }
.day-hd { display: flex; align-items: center; gap: 12rpx; margin-bottom: 6rpx; flex-wrap: wrap; }
.day-tag {
  font-size: 20rpx; color: #fff; background: #4facfe;
  padding: 4rpx 12rpx; border-radius: 8rpx;
}
.day-date { font-size: 22rpx; color: #4a8cc7; }
.day-mins { font-size: 22rpx; color: #99c4e8; margin-left: auto; }
.day-title { display: block; font-size: 26rpx; font-weight: 500; color: #333; margin-bottom: 4rpx; }
.day-desc { display: block; font-size: 22rpx; color: #777; line-height: 1.6; }
.proposal-expire {
  display: block; font-size: 20rpx; color: #99c4e8; margin-top: 12rpx;
}
.proposal-actions {
  display: flex; gap: 16rpx; margin-top: 20rpx;
}
.btn-proposal-reject, .btn-proposal-confirm {
  flex: 1; text-align: center; padding: 18rpx 0; border-radius: 12rpx;
  font-size: 26rpx;
}
.btn-proposal-reject {
  background: #fff; border: 1rpx solid #ddd; color: #666;
}
.btn-proposal-reject.disabled { opacity: 0.5; }
.btn-proposal-confirm {
  background: linear-gradient(135deg, #4facfe, #6cb4ee); color: #fff;
}
.btn-proposal-confirm.disabled { opacity: 0.6; }
.proposal-done {
  margin-top: 16rpx; padding: 16rpx; background: #e8f4fd;
  border-radius: 10rpx; text-align: center;
}
.proposal-done text { font-size: 24rpx; color: #4a8cc7; }

.rec-row { padding: 12rpx 0; border-bottom: 1rpx solid #eef5fb; }
.rec-row:last-child { border-bottom: none; }
.rec-txt { font-size: 24rpx; color: #555; }

/* 数据统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-top: 10rpx;
}
.stat-item {
  background: linear-gradient(135deg, #e8f4fd, #f0f7ff);
  border-radius: 12rpx;
  padding: 16rpx;
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #4facfe;
}
.stat-label {
  display: block;
  font-size: 20rpx;
  color: #99c4e8;
  margin-top: 4rpx;
}

/* 快捷标签 */
.quick-bar { display: flex; gap: 12rpx; padding: 0 24rpx; margin-bottom: 8rpx; }
.quick-pill {
  background: linear-gradient(135deg, #e8f4fd, #f0f7ff);
  font-size: 22rpx; color: #4a8cc7;
  padding: 10rpx 18rpx; border-radius: 22rpx; transition: all 0.15s;
  border: 1rpx solid rgba(79,172,254,0.15);
}
.quick-pill:active { background: #d4ecff; transform: scale(0.96); }

/* 输入栏 */
.input-card {
  flex-shrink: 0;
  margin: 0 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff; border-radius: 18rpx;
  padding: 12rpx 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(79,172,254,0.08);
}
.page.keyboard-open .input-card {
  margin-bottom: 20rpx;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: 72rpx;
}
.inp {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 72rpx;
}
.inp-ph { color: #b8d8f0; font-size: 28rpx; }

.voice-area {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
.voice-area.recording {
  background: rgba(79,172,254,0.12);
}

.voice-record-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}

.voice-record-cancel-zone {
  position: absolute;
  top: 18%;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.55;
  transition: opacity 0.15s, transform 0.15s;
}

.voice-record-cancel-zone.active {
  opacity: 1;
  transform: scale(1.05);
}

.voice-cancel-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  transition: background 0.15s;
}

.voice-record-cancel-zone.active .voice-cancel-icon-wrap {
  background: rgba(245, 108, 108, 0.35);
}

.voice-cancel-icon {
  font-size: 48rpx;
  color: #fff;
  font-weight: 600;
}

.voice-cancel-hint {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.voice-record-cancel-zone.active .voice-cancel-hint {
  color: #ffb4b4;
  font-weight: 600;
}

.voice-record-bubble {
  width: 320rpx;
  height: 320rpx;
  border-radius: 32rpx;
  background: rgba(60, 60, 60, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
}

.voice-record-bubble.cancel {
  background: rgba(180, 50, 50, 0.92);
  transform: scale(0.96);
}

.voice-wave-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 80rpx;
}

.voice-wave-bar {
  width: 8rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background: #95ec69;
  animation: voiceWave 0.8s ease-in-out infinite;
}

.voice-record-bubble.cancel .voice-wave-bar {
  background: #ffc9c9;
}

@keyframes voiceWave {
  0%, 100% { height: 24rpx; opacity: 0.5; }
  50% { height: 72rpx; opacity: 1; }
}

.voice-record-tip {
  margin-top: 48rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.voice-tip {
  font-size: 28rpx; color: #99c4e8;
}
.voice-tip.recording {
  color: #4facfe;
}

.input-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.inp-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inp-btn-icon {
  font-size: 36rpx;
  color: #bbb;
  line-height: 1;
}
.inp-btn-plus {
  font-size: 40rpx;
}

.inp-send {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 32rpx;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.inp-send.active {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
}
.inp-send.busy {
  background: #b8c9d8;
  opacity: 0.92;
}
.inp-send-txt {
  font-size: 26rpx;
  color: #fff;
  white-space: nowrap;
}

/* 附件菜单 */
.add-mask {
  position: fixed; left: 0; right: 0; bottom: 0; top: 0;
  background: rgba(0,0,0,0.2); z-index: 100;
  display: flex; align-items: flex-end;
}
.add-panel {
  width: 100%; background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 40rpx 80rpx;
  display: flex; justify-content: space-around;
}
.add-item {
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
}
.add-icon-box {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
}
.add-label { font-size: 22rpx; color: #555; }

/* 历史会话 */
.history-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 200;
  display: flex; align-items: flex-start; justify-content: flex-end;
}
.history-panel {
  width: 72%; max-width: 560rpx; height: 100%;
  background: #fff;
  display: flex; flex-direction: column;
  box-shadow: -4rpx 0 24rpx rgba(0,0,0,0.08);
}
.history-hd {
  flex-shrink: 0;
  padding: 120rpx 28rpx 20rpx;
  border-bottom: 1rpx solid #eef5fb;
  display: flex; align-items: center; justify-content: space-between;
}
.history-title { font-size: 32rpx; font-weight: 600; color: #222; }
.history-new {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  padding: 10rpx 20rpx; border-radius: 20rpx;
}
.history-new-txt { font-size: 22rpx; color: #fff; }
.history-scroll { flex: 1; height: 0; }
.history-empty { padding: 80rpx 28rpx; text-align: center; }
.history-empty-txt { font-size: 26rpx; color: #99c4e8; }
.history-item {
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #f0f7ff;
}
.history-item.active { background: #e8f4fd; }
.history-item-title {
  display: block; font-size: 28rpx; color: #333;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.history-item-meta {
  display: block; font-size: 22rpx; color: #99c4e8; margin-top: 6rpx;
}
.history-local { color: #4facfe; }
.history-loading { padding: 20rpx 28rpx 40rpx; text-align: center; }
.history-loading-txt { font-size: 22rpx; color: #99c4e8; }

/* 语音气泡 */
.voice-bubble {
  display: flex; align-items: center; gap: 12rpx;
  min-width: 160rpx;
}
.voice-play-icon {
  font-size: 28rpx; color: #fff; flex-shrink: 0;
}
.voice-wave {
  display: flex; align-items: flex-end; gap: 4rpx; height: 28rpx;
}
.wave-bar {
  width: 6rpx; height: 12rpx; background: rgba(255,255,255,0.5);
  border-radius: 3rpx;
}
.wave-bar.active { animation: voiceWave 0.6s ease-in-out infinite alternate; }
.wave-bar:nth-child(2).active { animation-delay: 0.1s; }
.wave-bar:nth-child(3).active { animation-delay: 0.2s; }
.wave-bar:nth-child(4).active { animation-delay: 0.3s; }
@keyframes voiceWave {
  from { height: 10rpx; }
  to { height: 26rpx; background: #fff; }
}
.voice-text {
  font-size: 24rpx; color: rgba(255,255,255,0.95);
  max-width: 320rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
</style>
