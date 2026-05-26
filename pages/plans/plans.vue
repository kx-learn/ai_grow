<template>
  <view class="plans-page">
    <growth-task-mini-bar />
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="bg-ball b1"></view>
      <view class="bg-ball b2"></view>
    </view>

    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text style="font-size:36rpx;color:#333;">‹</text>
      </view>
      <text class="nav-title">我的计划</text>
      <view class="nav-actions">
        <view class="nav-toggle" @tap="toggleViewMode">
          <text class="nav-toggle-txt">{{ viewMode === 'calendar' ? '时间轴' : '日历' }}</text>
        </view>
        <view class="nav-add" @tap="addPlan">
          <text style="font-size:36rpx;color:#4facfe;">＋</text>
        </view>
      </view>
    </view>

    <!-- 日历视图 -->
    <view v-if="viewMode === 'calendar'" class="calendar-card" :class="{ show: loaded }">
      <!-- 月份切换 -->
      <view class="month-row">
        <view class="month-arrow" @tap="prevMonth">
          <text style="font-size:32rpx;color:#333;">‹</text>
        </view>
        <text class="month-title">{{ curYear }}年{{ curMonth }}月</text>
        <view class="month-arrow" @tap="nextMonth">
          <text style="font-size:32rpx;color:#333;">›</text>
        </view>
      </view>

      <!-- 星期头 -->
      <view class="week-header">
        <text class="week-cell" v-for="w in weeks" :key="w">{{ w }}</text>
      </view>

      <!-- 日期格子 -->
      <view class="days-grid">
        <view
          v-for="(d, i) in calendarDays"
          :key="i"
          class="day-cell"
          :class="{
            empty: !d.day,
            today: d.isToday,
            selected: d.full === selectedDate,
            hasPlan: d.hasPlan
          }"
          @tap="d.day && selectDate(d.full)"
        >
          <text class="day-num">{{ d.day || '' }}</text>
          <view class="day-dot" v-if="d.hasPlan && d.day"></view>
        </view>
      </view>
    </view>

    <!-- 选中日期标题（日历视图） -->
    <view v-if="viewMode === 'calendar' && selectedDate" class="selected-header">
      <text class="selected-label">{{ selectedLabel }}</text>
      <text class="selected-count">{{ taskCountLabel }}</text>
    </view>

    <!-- 时间轴视图 -->
    <scroll-view
      v-if="viewMode === 'timeline'"
      class="timeline-scroll"
      scroll-y
      :bounces="false"
      :show-scrollbar="false"
      :scroll-into-view="timelineScrollInto"
      scroll-with-animation
      @scroll="onTimelineScroll"
      @scrolltolower="onTimelineScrollLower"
    >
      <view class="timeline-list">
        <view
          v-for="(day, di) in timelineDaysList"
          :key="day.date"
          :id="'timeline-day-' + day.date"
          :data-date="day.date"
          class="timeline-day"
          :class="{ 'is-today': day.isToday, 'no-tasks': day.loaded && !day.hasTasks }"
        >
          <view class="timeline-rail">
            <view class="timeline-dot" :class="{ today: day.isToday }"></view>
            <view v-if="di < timelineDaysList.length - 1" class="timeline-line"></view>
          </view>
          <view class="timeline-body">
            <view class="timeline-date-row">
              <text class="timeline-date-label">{{ day.label }}</text>
              <text v-if="day.isToday" class="timeline-today-tag">今天</text>
              <text v-if="day.loading" class="timeline-status">加载中…</text>
            </view>

            <template v-if="day.loaded && day.hasTasks">
              <view
                v-for="(p, pi) in day.tasks"
                :key="p.id"
                class="plan-card timeline-card"
                :class="{
                  show: loaded,
                  locked: p.locked && !p.isAssistant,
                  assistant: p.isAssistant,
                  'assistant-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming',
                  'assistant-due': p.isAssistant && !p.done && p.reminderPhase === 'due',
                  'assistant-overdue': p.isAssistant && !p.done && p.reminderPhase === 'overdue'
                }"
                :style="{ transitionDelay: (pi * 0.05) + 's' }"
                @tap="onTaskTap(p)"
              >
                <view class="plan-left">
                  <view class="plan-color-bar" :style="{ background: p.color }"></view>
                  <view class="plan-info">
                    <text
                      class="plan-name"
                      :class="{
                        done: p.done,
                        incomplete: p.incomplete,
                        skipped: p.skipped,
                        'assistant-title': p.isAssistant && !p.done,
                        'assistant-title-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming'
                      }"
                    >{{ p.name }}</text>
                    <view class="plan-meta">
                      <text style="font-size:22rpx;">{{ p.metaIcon }}</text>
                      <text
                        class="plan-time"
                        :class="{
                        'time-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming',
                        'time-overdue': p.isAssistant && !p.done && p.reminderPhase === 'overdue',
                        'time-due': p.isAssistant && !p.done && p.reminderPhase === 'due'
                      }"
                    >{{ p.time }}</text>
                    </view>
                  </view>
                </view>
                <view
                  class="plan-check"
                  :class="{
                    done: p.done,
                    locked: p.locked && !p.done,
                    skipped: p.skipped,
                    incomplete: p.incomplete,
                    completable: p.canComplete,
                    completing: completingTaskKey === taskCompleteKey(p)
                  }"
                  @tap.stop="onCheckTap(p, day.date)"
                >
                  <text v-if="p.done" style="font-size:28rpx;color:#fff;">✔</text>
                  <text v-else-if="p.skipped" class="check-label">跳</text>
                  <text v-else-if="p.incomplete" class="check-label muted">—</text>
                  <text v-else-if="p.canComplete" class="check-label todo">○</text>
                  <text v-else class="check-label muted">—</text>
                </view>
              </view>
            </template>
          </view>
        </view>
        <view class="timeline-footer">
          <text class="timeline-footer-txt">继续下滑加载更多日期</text>
        </view>
      </view>
    </scroll-view>

    <!-- 当日任务列表（日历视图） -->
    <scroll-view
      v-if="viewMode === 'calendar'"
      class="plan-scroll"
      scroll-y
      :bounces="false"
      :show-scrollbar="false"
    >
      <view class="plan-list">
        <view v-if="loadingTasks" class="empty">
          <text class="empty-text">加载中...</text>
        </view>

        <template v-else>
          <view
            v-for="(p, pi) in dayTasks"
            :key="p.id"
            class="plan-card"
            :class="{
              show: loaded,
              locked: p.locked && !p.isAssistant,
              assistant: p.isAssistant,
              'assistant-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming',
              'assistant-due': p.isAssistant && !p.done && p.reminderPhase === 'due',
              'assistant-overdue': p.isAssistant && !p.done && p.reminderPhase === 'overdue'
            }"
            :style="{ transitionDelay: (pi * 0.08) + 's' }"
            @tap="onTaskTap(p)"
          >
            <view class="plan-left">
              <view class="plan-color-bar" :style="{ background: p.color }"></view>
              <view class="plan-info">
                <text
                  class="plan-name"
                  :class="{
                    done: p.done,
                    incomplete: p.incomplete,
                    skipped: p.skipped,
                    'assistant-title': p.isAssistant && !p.done,
                    'assistant-title-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming'
                  }"
                >{{ p.name }}</text>
                <view class="plan-meta">
                  <text style="font-size:22rpx;">{{ p.metaIcon }}</text>
                  <text
                    class="plan-time"
                    :class="{
                    'time-upcoming': p.isAssistant && !p.done && p.reminderPhase === 'upcoming',
                    'time-overdue': p.isAssistant && !p.done && p.reminderPhase === 'overdue',
                    'time-due': p.isAssistant && !p.done && p.reminderPhase === 'due'
                  }"
                >{{ p.time }}</text>
                </view>
              </view>
            </view>
            <view
              class="plan-check"
              :class="{
                done: p.done,
                locked: p.locked && !p.done,
                skipped: p.skipped,
                incomplete: p.incomplete,
                completable: p.canComplete,
                completing: completingTaskKey === taskCompleteKey(p)
              }"
              @tap.stop="onCheckTap(p)"
            >
              <text v-if="p.done" style="font-size:28rpx;color:#fff;">✔</text>
              <text v-else-if="p.skipped" class="check-label">跳</text>
              <text v-else-if="p.incomplete" class="check-label muted">—</text>
              <text v-else-if="p.canComplete" class="check-label todo">○</text>
              <text v-else class="check-label muted">—</text>
            </view>
          </view>

          <view class="empty" v-if="dayTasks.length === 0">
          <text style="font-size:60rpx;opacity:0.3;">📅</text>
          <text class="empty-text">这一天还没有任务</text>
          <text class="empty-sub">与 AI 对话确认成长计划后自动生成</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, getCurrentInstance } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getGrowthTasksByDate, getGrowthTasksToday, completeUserTask } from '../../utils/api.js'

const loaded = ref(false)
const loadingTasks = ref(false)
const completingTaskKey = ref('')
let pollTimer = null
let endRefreshTimer = null
let assistantTickTimer = null
const dueToastedIds = new Set()
const tickNow = ref(Date.now())
const weeks = ['日', '一', '二', '三', '四', '五', '六']

const today = new Date()
const curYear = ref(today.getFullYear())
const curMonth = ref(today.getMonth() + 1)
const selectedDate = ref(formatDate(today))
const dayTasks = ref([])
const datesWithTasks = ref({})
const viewMode = ref('calendar')
const timelineDates = ref([])
const timelineByDate = ref({})
const timelineScrollInto = ref('')
let timelineSyncTimer = null
const TIMELINE_PAST_DAYS = 30
const TIMELINE_FUTURE_DAYS = 45
const TIMELINE_EXTEND_DAYS = 14
const PLANS_NAV_DATE_KEY = 'plans_navigate_date'

const growthTaskCount = computed(() => dayTasks.value.filter(t => !t.isAssistant).length)
const assistantTaskCount = computed(() => dayTasks.value.filter(t => t.isAssistant).length)
const taskCount = computed(() => dayTasks.value.length)
const taskCountLabel = computed(() => {
  const n = taskCount.value
  if (!n) return '0 项任务'
  const parts = []
  if (growthTaskCount.value) parts.push(`${growthTaskCount.value} 项计划`)
  if (assistantTaskCount.value) parts.push(`${assistantTaskCount.value} 项提醒`)
  return parts.join(' · ') || `${n} 项任务`
})

function parseRoutePlanDate(raw) {
  if (!raw) return ''
  const s = decodeURIComponent(String(raw)).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

/** 从对话提醒卡片等入口：日历视图定位到指定日 */
function applyPlanDate(dateStr) {
  if (!dateStr) return
  selectedDate.value = dateStr
  const parts = dateStr.split('-').map(n => parseInt(n, 10))
  if (parts.length >= 2 && parts[0] && parts[1]) {
    curYear.value = parts[0]
    curMonth.value = parts[1]
  }
  viewMode.value = 'calendar'
}

onLoad((options) => {
  const d = parseRoutePlanDate(options?.date)
  if (d) applyPlanDate(d)
})

onMounted(() => {
  nextTick(() => { setTimeout(() => { loaded.value = true }, 50) })
  loadTasksForDate(selectedDate.value)
})

function consumePendingPlanNavigateDate() {
  let raw = ''
  try {
    raw = uni.getStorageSync(PLANS_NAV_DATE_KEY)
    if (raw) uni.removeStorageSync(PLANS_NAV_DATE_KEY)
  } catch (e) { /* ignore */ }
  const d = parseRoutePlanDate(raw)
  if (!d) return false
  applyPlanDate(d)
  loadTasksForDate(d)
  return true
}

onShow(() => {
  if (consumePendingPlanNavigateDate()) return
  if (viewMode.value === 'timeline') {
    nextTick(() => {
      bootstrapTimelineLoad(formatDate(today)).then(() => {
        scheduleSyncVisibleTimelineDays()
      })
    })
  } else if (selectedDate.value) {
    loadTasksForDate(selectedDate.value)
  }
})

onUnmounted(() => {
  clearTaskTimers()
  if (timelineSyncTimer) {
    clearTimeout(timelineSyncTimer)
    timelineSyncTimer = null
  }
})

watch(selectedDate, (date) => {
  if (viewMode.value !== 'calendar') return
  clearTaskTimers()
  loadTasksForDate(date)
})

const timelineDaysList = computed(() => {
  void tickNow.value
  return timelineDates.value.map(date => {
    const entry = timelineByDate.value[date] || {}
    const tasks = entry.tasks || []
    return {
      date,
      isToday: date === formatDate(today),
      label: formatTimelineDayLabel(date),
      tasks,
      loaded: !!entry.loaded,
      loading: !!entry.loading,
      hasTasks: tasks.length > 0
    }
  })
})

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 生成日历数据
const calendarDays = computed(() => {
  const year = curYear.value
  const month = curMonth.value - 1
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  // 前面空格
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0 })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const full = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = full === formatDate(today)
    const hasPlan = !!datesWithTasks.value[full]
    days.push({ day: d, full, isToday, hasPlan })
  }

  return days
})

const FINAL_STATUS = ['COMPLETED', 'SKIPPED', 'INCOMPLETE']

const STATUS_COLORS = {
  COMPLETED: '#67c23a',
  IN_PROGRESS: '#4facfe',
  PENDING: '#7b6df0',
  SKIPPED: '#c0c4cc',
  INCOMPLETE: '#f56c6c'
}

const STATUS_LABELS = {
  PENDING: '待执行',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  SKIPPED: '已跳过',
  INCOMPLETE: '未完成'
}

function formatTimeFromIso(iso) {
  if (!iso) return ''
  const m = String(iso).match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

function isPlanLinkedAssistantTitle(title) {
  return String(title || '').startsWith('[学习计划]')
}

function parseDueAtMs(dueAt) {
  if (!dueAt) return NaN
  return new Date(dueAt).getTime()
}

/** 单纯提醒：未到 / 刚到 / 已过 */
function getAssistantReminderPhase(dueAt, now = Date.now()) {
  const due = parseDueAtMs(dueAt)
  if (Number.isNaN(due)) return { phase: 'upcoming', label: '' }
  const diff = due - now
  if (diff > 60000) {
    const t = formatTimeFromIso(dueAt)
    return { phase: 'upcoming', label: t ? `${t} 提醒` : '待提醒' }
  }
  if (diff >= -60000) {
    return { phase: 'due', label: '到点了' }
  }
  return { phase: 'overdue', label: formatOverdueLabel(-diff) }
}

function formatOverdueLabel(overdueMs) {
  const min = Math.floor(overdueMs / 60000)
  if (min < 60) return `已过 ${min} 分钟`
  const h = Math.floor(min / 60)
  const rm = min % 60
  if (h < 24) return rm ? `已过 ${h} 小时 ${rm} 分钟` : `已过 ${h} 小时`
  const d = Math.floor(h / 24)
  return `已过 ${d} 天`
}

function mapAssistantTask(task) {
  const status = task.status || 'OPEN'
  if (status === 'DONE') {
    return {
      id: 'assistant-' + task.id,
      assistantId: task.id,
      isAssistant: true,
      name: task.title || '提醒',
      time: '已完成',
      date: task.dueDate || '',
      color: '#67c23a',
      dueAt: task.dueAt || '',
      reminderPhase: 'done',
      status: 'DONE',
      metaIcon: '✓',
      locked: true,
      done: true,
      canComplete: false,
      skipped: false,
      incomplete: false
    }
  }
  const dueAt = task.dueAt || ''
  const { phase, label } = getAssistantReminderPhase(dueAt, tickNow.value)
  const colors = {
    upcoming: '#52c41a',
    due: '#fa8c16',
    overdue: '#999'
  }
  return {
    id: 'assistant-' + task.id,
    assistantId: task.id,
    isAssistant: true,
    name: task.title || '提醒',
    time: label,
    date: task.dueDate || '',
    color: colors[phase] || '#52c41a',
    dueAt,
    reminderPhase: phase,
    status,
    metaIcon: phase === 'overdue' ? '⏱' : '🔔',
    locked: true,
    done: false,
    canComplete: status === 'OPEN',
    skipped: false,
    incomplete: false
  }
}

function mapAssistantTaskList(tasks, now = tickNow.value) {
  return tasks.map(t => {
    if (!t.isAssistant || t.done) return t
    const { phase, label } = getAssistantReminderPhase(t.dueAt, now)
    const colors = { upcoming: '#52c41a', due: '#fa8c16', overdue: '#999' }
    return {
      ...t,
      time: label,
      reminderPhase: phase,
      color: colors[phase] || t.color,
      metaIcon: phase === 'overdue' ? '⏱' : '🔔'
    }
  })
}

function refreshAssistantDisplay() {
  tickNow.value = Date.now()
  let changed = false
  dayTasks.value = dayTasks.value.map(t => {
    if (!t.isAssistant) return t
    const { phase, label } = getAssistantReminderPhase(t.dueAt, tickNow.value)
    if (phase === t.reminderPhase && label === t.time) return t
    changed = true
    const colors = { upcoming: '#52c41a', due: '#fa8c16', overdue: '#999' }
    return {
      ...t,
      time: label,
      reminderPhase: phase,
      color: colors[phase] || t.color,
      metaIcon: phase === 'overdue' ? '⏱' : '🔔'
    }
  })
  refreshTimelineTodayAssistants()
  if (changed) checkAssistantDueToasts()
}

function refreshTimelineTodayAssistants() {
  const todayStr = formatDate(today)
  const entry = timelineByDate.value[todayStr]
  if (!entry?.loaded || !entry.tasks.some(t => t.isAssistant)) return
  const tasks = mapAssistantTaskList(entry.tasks)
  timelineByDate.value = {
    ...timelineByDate.value,
    [todayStr]: { ...entry, tasks }
  }
}

function checkAssistantDueToasts() {
  const todayStr = formatDate(today)
  const list = []
  if (viewMode.value === 'calendar' && selectedDate.value === todayStr) {
    list.push(...dayTasks.value)
  }
  if (viewMode.value === 'timeline') {
    const entry = timelineByDate.value[todayStr]
    if (entry?.tasks) list.push(...entry.tasks)
  }
  if (!list.length) return
  const now = tickNow.value
  for (const t of list) {
    if (!t.isAssistant || t.status !== 'OPEN') continue
    const due = parseDueAtMs(t.dueAt)
    if (Number.isNaN(due)) continue
    const key = String(t.assistantId)
    if (dueToastedIds.has(key)) continue
    if (now >= due && now < due + 120000) {
      dueToastedIds.add(key)
      uni.showToast({ title: '提醒：' + t.name, icon: 'none', duration: 2800 })
    }
  }
}

function scheduleAssistantTick() {
  if (assistantTickTimer) {
    clearInterval(assistantTickTimer)
    assistantTickTimer = null
  }
  const hasCalendarAssistant =
    viewMode.value === 'calendar' &&
    dayTasks.value.some(t => t.isAssistant && t.status === 'OPEN') &&
    selectedDate.value === formatDate(today)
  const todayEntry = timelineByDate.value[formatDate(today)]
  const hasTimelineAssistant =
    viewMode.value === 'timeline' &&
    todayEntry?.tasks?.some(t => t.isAssistant && t.status === 'OPEN')
  if (!hasCalendarAssistant && !hasTimelineAssistant) return
  assistantTickTimer = setInterval(() => {
    refreshAssistantDisplay()
  }, 15000)
  refreshAssistantDisplay()
}

function formatTaskTime(task, status) {
  if (status === 'INCOMPLETE') return '已过期未完成'
  if (status === 'SKIPPED') return '已跳过'
  if (status === 'COMPLETED') return '已完成'
  if (status === 'IN_PROGRESS') return '待完成'
  if (task.estimatedMinutes) return `约 ${task.estimatedMinutes} 分钟`
  return '待完成'
}

function mapGrowthTask(task, viewDate) {
  const status = task.status || 'PENDING'
  const scheduledDate = task.scheduledDate || viewDate
  const done = status === 'COMPLETED'
  const skipped = status === 'SKIPPED'
  const incomplete = status === 'INCOMPLETE'
  const onPlanDay = scheduledDate === viewDate
  const canComplete =
    onPlanDay && (status === 'PENDING' || status === 'IN_PROGRESS')
  const locked = !canComplete

  let metaIcon = '⏰'
  if (incomplete) metaIcon = '⚠️'
  else if (skipped) metaIcon = '⊘'
  else if (done) metaIcon = '✓'

  return {
    id: task.id,
    isAssistant: false,
    name: task.title || '未命名任务',
    time: formatTaskTime(task, status),
    date: scheduledDate,
    color: STATUS_COLORS[status] || '#7b6df0',
    done,
    skipped,
    incomplete,
    locked,
    canComplete,
    status,
    metaIcon,
    description: task.description || ''
  }
}

function taskCompleteKey(p) {
  return p.isAssistant ? 'a-' + p.assistantId : 'g-' + p.id
}

function clearTaskTimers() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (endRefreshTimer) {
    clearTimeout(endRefreshTimer)
    endRefreshTimer = null
  }
  if (assistantTickTimer) {
    clearInterval(assistantTickTimer)
    assistantTickTimer = null
  }
}

function scheduleTaskRefresh() {
  clearTaskTimers()
}

function filterAssistantTasks(assistantRaw) {
  return (assistantRaw || [])
    .filter(t => {
      if (isPlanLinkedAssistantTitle(t.title)) return false
      const st = t.status || 'OPEN'
      return st === 'OPEN' || st === 'DONE'
    })
    .sort((a, b) => (parseDueAtMs(a.dueAt) || 0) - (parseDueAtMs(b.dueAt) || 0))
}

function mergeDayTasks(growthList, assistantRaw) {
  const assistants = filterAssistantTasks(assistantRaw).map(mapAssistantTask)
  return [...growthList, ...assistants]
}

async function fetchDayTasksData(date) {
  const isViewToday = date === formatDate(today)
  const res = isViewToday
    ? await getGrowthTasksToday()
    : await getGrowthTasksByDate(date)
  const rawTasks = res?.tasks || res?.items || []
  const growthList = rawTasks.map(t => mapGrowthTask(t, date))
  const assistantRaw = res?.assistantTasks || []
  const assistantShown = filterAssistantTasks(assistantRaw)
  const tasks = mergeDayTasks(growthList, assistantRaw)
  return {
    tasks,
    hasTasks: growthList.length + assistantShown.length > 0
  }
}

async function ensureTimelineDayLoaded(date, options = {}) {
  const { force = false } = options
  if (!date) return
  const prev = timelineByDate.value[date]
  if (!force && (prev?.loaded || prev?.loading)) return

  timelineByDate.value = {
    ...timelineByDate.value,
    [date]: { tasks: prev?.tasks || [], loaded: false, loading: true }
  }
  try {
    const { tasks, hasTasks } = await fetchDayTasksData(date)
    timelineByDate.value = {
      ...timelineByDate.value,
      [date]: { tasks, loaded: true, loading: false }
    }
    datesWithTasks.value = { ...datesWithTasks.value, [date]: hasTasks }
    if (date === formatDate(today)) scheduleAssistantTick()
  } catch (e) {
    timelineByDate.value = {
      ...timelineByDate.value,
      [date]: { tasks: prev?.tasks || [], loaded: true, loading: false }
    }
  }
}

function addDaysToDateStr(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return formatDate(d)
}

function buildDateRange(startStr, endStr) {
  const list = []
  let cur = startStr
  while (cur <= endStr) {
    list.push(cur)
    cur = addDaysToDateStr(cur, 1)
  }
  return list
}

function initTimelineDates() {
  const todayStr = formatDate(today)
  const start = addDaysToDateStr(todayStr, -TIMELINE_PAST_DAYS)
  const end = addDaysToDateStr(todayStr, TIMELINE_FUTURE_DAYS)
  timelineDates.value = buildDateRange(start, end)
}

function getTimelineQueryCtx() {
  const instance = getCurrentInstance()
  return instance?.proxy
}

/** 先查今天，再查昨天/明天，最后查锚点附近的其它日期 */
function bootstrapTimelineLoad(anchorDate) {
  if (!timelineDates.value.length) initTimelineDates()
  const todayStr = formatDate(today)
  const anchor = anchorDate || todayStr
  const yesterday = addDaysToDateStr(todayStr, -1)
  const tomorrow = addDaysToDateStr(todayStr, 1)
  const prioritySet = new Set([todayStr, yesterday, tomorrow])

  let idx = timelineDates.value.indexOf(anchor)
  if (idx < 0) idx = timelineDates.value.findIndex(d => d >= anchor)
  if (idx < 0) idx = 0
  const from = Math.max(0, idx - 10)
  const to = Math.min(timelineDates.value.length, idx + 15)

  return (async () => {
    await ensureTimelineDayLoaded(todayStr)
    await Promise.all([
      ensureTimelineDayLoaded(yesterday),
      ensureTimelineDayLoaded(tomorrow)
    ])
    for (let i = from; i < to; i++) {
      const d = timelineDates.value[i]
      if (!prioritySet.has(d)) ensureTimelineDayLoaded(d)
    }
  })()
}

/** 时间轴滚动定位到「今天」 */
function scrollTimelineToDate(dateStr) {
  const target = dateStr || formatDate(today)
  const targetId = 'timeline-day-' + target
  nextTick(() => {
    timelineScrollInto.value = ''
    nextTick(() => {
      setTimeout(() => {
        timelineScrollInto.value = targetId
        setTimeout(() => {
          timelineScrollInto.value = ''
          scheduleSyncVisibleTimelineDays()
        }, 550)
      }, 80)
    })
  })
}

function scrollTimelineToToday() {
  scrollTimelineToDate(formatDate(today))
}

function scheduleSyncVisibleTimelineDays() {
  if (viewMode.value !== 'timeline') return
  if (timelineSyncTimer) clearTimeout(timelineSyncTimer)
  timelineSyncTimer = setTimeout(() => {
    timelineSyncTimer = null
    syncVisibleTimelineDays()
  }, 80)
}

/** 时间轴：当前屏幕内能看到的每一天都请求一次任务接口 */
function syncVisibleTimelineDays() {
  if (viewMode.value !== 'timeline') return
  const ctx = getTimelineQueryCtx()
  if (!ctx) {
    bootstrapTimelineLoad(formatDate(today))
    return
  }

  const sys = uni.getSystemInfoSync()
  const winBottom = sys.windowHeight || 800
  const topInset = (sys.statusBarHeight || 20) + 100
  const bottomInset = 24

  uni.createSelectorQuery()
    .in(ctx)
    .selectAll('.timeline-day')
    .boundingClientRect()
    .exec((res) => {
      const rects = Array.isArray(res?.[0]) ? res[0] : res?.[1]
      if (!rects?.length) {
        bootstrapTimelineLoad(formatDate(today))
        return
      }

      let visibleCount = 0
      rects.forEach((rect, index) => {
        if (!rect) return
        const inView = rect.bottom > topInset && rect.top < winBottom - bottomInset
        if (!inView) return
        visibleCount++
        const date = timelineDates.value[index]
        if (date) ensureTimelineDayLoaded(date)
      })

      if (visibleCount === 0) {
        bootstrapTimelineLoad(formatDate(today))
      }
    })
}

function onTimelineScroll() {
  scheduleSyncVisibleTimelineDays()
}

function extendTimelineDatesForward() {
  const last = timelineDates.value[timelineDates.value.length - 1]
  if (!last) return
  const extra = []
  for (let i = 1; i <= TIMELINE_EXTEND_DAYS; i++) {
    extra.push(addDaysToDateStr(last, i))
  }
  timelineDates.value = [...timelineDates.value, ...extra]
  nextTick(() => scheduleSyncVisibleTimelineDays())
}

function onTimelineScrollLower() {
  extendTimelineDatesForward()
}

function formatTimelineDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const ws = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  if (dateStr === formatDate(today)) return '今天'
  const y = new Date(formatDate(today) + 'T12:00:00')
  y.setDate(y.getDate() - 1)
  if (dateStr === formatDate(y)) return '昨天'
  const tmr = new Date(formatDate(today) + 'T12:00:00')
  tmr.setDate(tmr.getDate() + 1)
  if (dateStr === formatDate(tmr)) return '明天'
  return `${d.getMonth() + 1}月${d.getDate()}日 ${ws[d.getDay()]}`
}

function toggleViewMode() {
  if (viewMode.value === 'calendar') {
    viewMode.value = 'timeline'
    clearTaskTimers()
    if (!timelineDates.value.length) initTimelineDates()
    nextTick(async () => {
      await bootstrapTimelineLoad(formatDate(today))
      scrollTimelineToToday()
    })
  } else {
    viewMode.value = 'calendar'
    loadTasksForDate(selectedDate.value)
  }
}

async function loadTasksForDate(date, options = {}) {
  if (!date) return
  const { silent = false } = options
  if (!silent) loadingTasks.value = true
  try {
    const { tasks, hasTasks } = await fetchDayTasksData(date)
    dayTasks.value = tasks
    datesWithTasks.value = {
      ...datesWithTasks.value,
      [date]: hasTasks
    }
    scheduleTaskRefresh()
    scheduleAssistantTick()
    if (date === formatDate(today)) checkAssistantDueToasts()
  } catch (e) {
    if (!silent) {
      dayTasks.value = []
      uni.showToast({ title: e.message || '加载任务失败', icon: 'none' })
    }
  } finally {
    if (!silent) loadingTasks.value = false
  }
}

const selectedLabel = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  const ws = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const isToday = selectedDate.value === formatDate(today)
  const prefix = isToday ? '今天 · ' : ''
  return `${prefix}${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${ws[d.getDay()]}`
})

function selectDate(full) {
  selectedDate.value = full
}

function prevMonth() {
  if (curMonth.value === 1) {
    curMonth.value = 12
    curYear.value--
  } else {
    curMonth.value--
  }
}

function nextMonth() {
  if (curMonth.value === 12) {
    curMonth.value = 1
    curYear.value++
  } else {
    curMonth.value++
  }
}

function lockedToast(p) {
  if (p.incomplete) return '该任务已过期，无法标记完成'
  if (p.skipped) return '该任务已跳过'
  if (p.done) return '该任务已完成'
  if (!p.isAssistant && (p.status === 'PENDING' || p.status === 'IN_PROGRESS')) {
    return '请在该任务的计划日标记完成'
  }
  return '当前状态无法标记完成'
}

async function onCheckTap(p, viewDate) {
  const date = viewDate || selectedDate.value
  if (!p.canComplete) {
    uni.showToast({ title: lockedToast(p), icon: 'none' })
    return
  }
  const key = taskCompleteKey(p)
  if (completingTaskKey.value) return

  completingTaskKey.value = key
  try {
    await completeUserTask({
      source: p.isAssistant ? 'assistant' : 'growth',
      taskId: p.isAssistant ? p.assistantId : p.id
    })
    if (viewMode.value === 'timeline') {
      await ensureTimelineDayLoaded(date, { force: true })
    } else {
      await loadTasksForDate(date, { silent: true })
    }
    uni.showToast({ title: '已标记完成', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '标记失败', icon: 'none' })
  } finally {
    completingTaskKey.value = ''
  }
}

function onTaskTap(p) {
  const statusLabel = STATUS_LABELS[p.status] || p.status
  let hint = ''
  if (p.canComplete) hint = '，点击 ○ 标记完成'
  else if (p.incomplete) hint = '，已过期不可操作'
  else if (p.done) hint = '，已完成'
  uni.showToast({
    title: p.name + ' · ' + statusLabel + hint,
    icon: 'none',
    duration: 2500
  })
}

function goBack() {
  uni.navigateBack()
}

function addPlan() {
  uni.showToast({ title: '添加计划功能开发中', icon: 'none' })
}
</script>

<style scoped>
.plans-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f4f8;
  position: relative;
  overflow: hidden;
}

.bg-decor {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 300rpx;
  overflow: hidden;
}

.bg-ball {
  position: absolute;
  border-radius: 50%;
}

.b1 {
  width: 300rpx; height: 300rpx;
  background: rgba(79, 172, 254, 0.08);
  top: -160rpx; right: -80rpx;
  animation: floatB 7s ease-in-out infinite;
}

.b2 {
  width: 160rpx; height: 160rpx;
  background: rgba(123, 109, 240, 0.06);
  top: 40rpx; left: -40rpx;
  animation: floatB 5s ease-in-out infinite reverse;
}

@keyframes floatB {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(16rpx); }
}


/* 导航栏 */
.nav-bar {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 100rpx 32rpx 16rpx;
}

.nav-back {
  width: 56rpx; height: 56rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nav-toggle {
  height: 56rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(79, 172, 254, 0.25);
}

.nav-toggle-txt {
  font-size: 24rpx;
  color: #4facfe;
  font-weight: 600;
}

.nav-add {
  width: 56rpx; height: 56rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
}

.timeline-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  position: relative;
  z-index: 10;
}

.timeline-list {
  padding: 8rpx 24rpx 48rpx;
}

.timeline-day {
  display: flex;
  gap: 20rpx;
  margin-bottom: 8rpx;
}

.timeline-day.no-tasks {
  margin-bottom: 4rpx;
}

.timeline-day.no-tasks .timeline-body {
  padding-bottom: 8rpx;
}

.timeline-rail {
  width: 28rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d0dce8;
  margin-top: 14rpx;
  flex-shrink: 0;
}

.timeline-dot.today {
  width: 20rpx;
  height: 20rpx;
  background: #4facfe;
  box-shadow: 0 0 0 6rpx rgba(79, 172, 254, 0.2);
}

.timeline-line {
  flex: 1;
  width: 4rpx;
  min-height: 24rpx;
  background: linear-gradient(180deg, #d8e6f2 0%, rgba(216, 230, 242, 0.2) 100%);
  margin-top: 8rpx;
}

.timeline-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 20rpx;
}

.timeline-date-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0 12rpx;
  min-height: 48rpx;
}

.timeline-day.no-tasks .timeline-date-row {
  padding-bottom: 4rpx;
}

.timeline-date-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #444;
}

.timeline-day.is-today .timeline-date-label {
  color: #4facfe;
}

.timeline-day.no-tasks .timeline-date-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #999;
}

.timeline-today-tag {
  font-size: 20rpx;
  color: #4facfe;
  background: rgba(79, 172, 254, 0.12);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.timeline-status {
  font-size: 22rpx;
  color: #bbb;
  margin-left: auto;
}

.timeline-card {
  margin-bottom: 12rpx;
  opacity: 1;
}

.timeline-footer {
  text-align: center;
  padding: 24rpx 0 16rpx;
}

.timeline-footer-txt {
  font-size: 22rpx;
  color: #ccc;
}

/* 日历卡片 */
.calendar-card {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 20rpx 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(79, 172, 254, 0.08);
  opacity: 0;
}

.calendar-card.show {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s;
}

/* 月份切换 */
.month-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 12rpx;
}

.month-arrow {
  width: 48rpx; height: 48rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}

.month-arrow:active {
  background: #f0f4f8;
}

.month-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

/* 星期头 */
.week-header {
  display: flex;
  margin-bottom: 12rpx;
}

.week-cell {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
  padding: 8rpx 0;
}

/* 日期格子 */
.days-grid {
  display: flex;
  flex-wrap: wrap;
}

.day-cell {
  width: calc(100% / 7);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  transition: all 0.2s;
  position: relative;
}

.day-cell:not(.empty):active {
  transform: scale(0.9);
}

.day-num {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.day-cell.today .day-num {
  color: #4facfe;
  font-weight: 700;
}

.day-cell.selected {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  box-shadow: 0 4rpx 16rpx rgba(79, 172, 254, 0.3);
}

.day-cell.selected .day-num {
  color: #fff;
  font-weight: 700;
}

.day-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #4facfe;
  margin-top: 4rpx;
  position: absolute;
  bottom: 10rpx;
}

.day-cell.selected .day-dot {
  background: rgba(255,255,255,0.8);
}

/* 选中日期标题 */
.selected-header {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 36rpx 12rpx;
}

.selected-label {
  font-size: 26rpx;
  color: #555;
  font-weight: 600;
}

.selected-count {
  font-size: 22rpx;
  color: #bbb;
}

/* 计划列表滚动区 */
.plan-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  position: relative;
  z-index: 10;
}

.plan-list {
  padding: 0 24rpx 40rpx;
}

.plan-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 14rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  opacity: 0;
  transition: opacity 0.3s ease-out;
}

.plan-card.show {
  opacity: 1;
}

.plan-card:active {
  opacity: 0.85;
}

.plan-card.locked:active {
  opacity: 1;
}

.plan-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
}

.plan-color-bar {
  width: 6rpx;
  height: 44rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
}

.plan-info {
  flex: 1;
}

.plan-name {
  display: block;
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
  transition: all 0.2s;
}

.plan-name.done {
  color: #ccc;
  text-decoration: line-through;
}

.plan-name.incomplete {
  color: #e6a0a0;
}

.plan-name.skipped {
  color: #bbb;
  text-decoration: line-through;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 8rpx;
}

.plan-time {
  font-size: 22rpx;
  color: #aaa;
}

.plan-time.time-upcoming {
  color: #52c41a;
  font-weight: 500;
}

.plan-time.time-due {
  color: #fa8c16;
  font-weight: 600;
}

.plan-time.time-overdue {
  color: #999;
}

.plan-card.assistant-upcoming {
  background: linear-gradient(90deg, rgba(82, 196, 26, 0.06) 0%, #fff 28%);
}

.plan-card.assistant-due {
  background: linear-gradient(90deg, rgba(250, 140, 22, 0.1) 0%, #fff 28%);
  box-shadow: 0 2rpx 16rpx rgba(250, 140, 22, 0.15);
}

.plan-card.assistant-overdue {
  opacity: 0.92;
}

.plan-name.assistant-title-upcoming {
  color: #389e0d;
}

.plan-remind-badge {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(82, 196, 26, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plan-card.assistant-overdue .plan-remind-badge {
  background: rgba(0, 0, 0, 0.05);
}

.remind-icon {
  font-size: 26rpx;
}

.plan-check {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  flex-shrink: 0;
}

.plan-check:active {
  transform: scale(0.9);
}

.plan-check.done {
  background: linear-gradient(135deg, #4facfe, #6cb4ee);
  border-color: transparent;
  box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.3);
}

.plan-check.completable {
  border-color: #4facfe;
  background: rgba(79, 172, 254, 0.08);
}

.plan-check.completing {
  opacity: 0.6;
}

.check-label.todo {
  font-size: 32rpx;
  color: #4facfe;
  font-weight: 400;
  line-height: 1;
}

.plan-check.locked,
.plan-check.incomplete,
.plan-check.skipped {
  border-color: #e8e8e8;
  background: #f7f7f7;
}

.plan-check.incomplete {
  border-color: #f5d0d0;
  background: #fff5f5;
}

.check-label {
  font-size: 22rpx;
  color: #999;
  font-weight: 600;
}

.check-label.muted {
  color: #ccc;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 80rpx 0 40rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

.empty-sub {
  display: block;
  font-size: 22rpx;
  color: #ccc;
  margin-top: 8rpx;
}
</style>
