/** 助手任务（3.1 GET /users/me/tasks）→ 聊天/卡片展示 */

export function isPlanLinkedAssistantTitle(title) {
  return String(title || '').startsWith('[学习计划]')
}

function formatTimeFromIso(iso) {
  if (!iso) return ''
  const m = String(iso).match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

function parseDueAtMs(dueAt) {
  if (!dueAt) return NaN
  return new Date(dueAt).getTime()
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

export function getAssistantReminderPhase(dueAt, now = Date.now()) {
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

const PHASE_COLORS = {
  upcoming: '#52c41a',
  due: '#fa8c16',
  overdue: '#999',
  done: '#67c23a'
}

/** 将 3.1 接口单条 task 转为卡片行 */
export function mapAssistantTaskRow(task, now = Date.now()) {
  const status = task.status || 'OPEN'
  const title = task.title || '提醒'
  if (isPlanLinkedAssistantTitle(title)) return null

  if (status === 'DONE') {
    return {
      id: task.id,
      name: title,
      time: '已完成',
      phase: 'done',
      status,
      color: PHASE_COLORS.done,
      metaIcon: '✓',
      dueAt: task.dueAt || ''
    }
  }

  const dueAt = task.dueAt || ''
  const { phase, label } = getAssistantReminderPhase(dueAt, now)
  return {
    id: task.id,
    name: title,
    time: label || '待提醒',
    phase,
    status,
    color: PHASE_COLORS[phase] || PHASE_COLORS.upcoming,
    metaIcon: phase === 'overdue' ? '⏱' : '🔔',
    dueAt
  }
}

function formatDateYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 从助手 reply 推断提醒所属日期（仅展示该日助手提醒，不用全量 OPEN 列表） */
export function parseReminderTargetDate(content) {
  const text = String(content || '')
  const now = new Date()
  const today = formatDateYmd(now)

  const iso = text.match(/(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]

  if (/后天/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 2)
    return formatDateYmd(d)
  }
  if (/明天|明早|明晚|翌日/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return formatDateYmd(d)
  }
  if (/今天|今晚|今早|今天下午|今天晚上|今日/.test(text)) return today

  if (/(\d{1,2})\s*月\s*(\d{1,2})\s*日/.test(text)) {
    const m = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
    if (m) {
      const d = new Date(now.getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10))
      return formatDateYmd(d)
    }
  }

  return today
}

/** growth-tasks 按日接口：只取当日 assistantTasks（不含学习计划任务） */
export function mapAssistantTasksForDayResponse(res, roundAction, now = Date.now()) {
  let raw = res?.assistantTasks || []
  raw = raw.filter(t => !isPlanLinkedAssistantTitle(t.title))

  if (roundAction === 'REMINDER_COMPLETED') {
    raw = raw.filter(t => (t.status || 'OPEN') === 'DONE')
  } else if (roundAction === 'REMINDER_DELETED') {
    raw = raw.filter(t => (t.status || 'OPEN') === 'OPEN')
  } else {
    raw = raw.filter(t => {
      const st = t.status || 'OPEN'
      return st === 'OPEN' || (roundAction === 'REMINDER_QUERIED' && st === 'DONE')
    })
  }

  return raw
    .map(t => mapAssistantTaskRow(t, now))
    .filter(Boolean)
    .sort((a, b) => (parseDueAtMs(a.dueAt) || 0) - (parseDueAtMs(b.dueAt) || 0))
}
