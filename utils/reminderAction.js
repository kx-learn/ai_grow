/** AI 对话 roundAction → 提醒操作卡片（与后端约定一致） */

export const REMINDER_ROUND_ACTIONS = [
  'REMINDER_QUERIED',
  'REMINDER_CREATED',
  'REMINDER_UPDATED',
  'REMINDER_DELETED',
  'REMINDER_COMPLETED'
]

const META = {
  REMINDER_QUERIED: {
    variant: 'queried',
    label: '提醒查询',
    icon: '🔍',
    subtitle: '已同步最新提醒列表'
  },
  REMINDER_CREATED: {
    variant: 'created',
    label: '已新增提醒',
    icon: '➕',
    subtitle: '提醒已加入你的日程'
  },
  REMINDER_UPDATED: {
    variant: 'updated',
    label: '已修改提醒',
    icon: '✏️',
    subtitle: '提醒内容已更新'
  },
  REMINDER_DELETED: {
    variant: 'deleted',
    label: '已删除提醒',
    icon: '🗑️',
    subtitle: '该提醒已移除'
  },
  REMINDER_COMPLETED: {
    variant: 'completed',
    label: '已完成提醒',
    icon: '✓',
    subtitle: '提醒已标记完成'
  }
}

export function isReminderRoundAction(action) {
  return !!action && REMINDER_ROUND_ACTIONS.includes(action)
}

/** 从接口消息（USER/ASSISTANT）解析 roundAction；null / CHAT_ONLY 不展示卡片 */
export function extractRoundActionFromApiMessage(m) {
  if (!m) return null
  const role = String(m.role || '').toUpperCase()
  if (role === 'USER') return null
  const raw = m.roundAction ?? m.round_action ?? null
  if (!raw || raw === 'CHAT_ONLY') return null
  return isReminderRoundAction(raw) ? raw : null
}

/** 非纯对话的提醒类操作：需拉取 3.1 任务列表 */
export function shouldFetchReminderTasks(roundAction) {
  return isReminderRoundAction(roundAction)
}

export function getReminderActionMeta(roundAction) {
  return META[roundAction] || null
}

export function createReminderActionMessage({ id, content, roundAction, targetDate }) {
  const meta = getReminderActionMeta(roundAction)
  if (!meta) return null
  const needsTasks = shouldFetchReminderTasks(roundAction)
  return {
    role: 'ai',
    type: 'reminderAction',
    id,
    content: content || '',
    roundAction,
    targetDate: targetDate || null,
    variant: meta.variant,
    label: meta.label,
    icon: meta.icon,
    subtitle: meta.subtitle,
    tasks: [],
    tasksLoading: needsTasks,
    tasksLoaded: !needsTasks,
    tasksError: false,
    show: true
  }
}
