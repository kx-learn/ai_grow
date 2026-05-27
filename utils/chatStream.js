/**
 * AI 对话 SSE 流式接口（/api/v1/ai/chat/stream）
 * H5 / App：fetch + ReadableStream
 * 微信小程序：enableChunked + onChunkReceived（不支持时回退整包 /chat）
 */
import { BASE_URL, getAccessToken, sendChatMessage } from './api.js'

/** @typedef {'ROUTING' | 'PREPARING' | 'EXECUTING'} AiChatPhase */

/**
 * @typedef {Object} AiChatProgressEvent
 * @property {'progress'} type
 * @property {string} code
 * @property {string} message
 * @property {AiChatPhase} phase
 * @property {number | null} sessionId
 * @property {string} traceId
 * @property {string | null} [tool]
 * @property {number | null} [round]
 * @property {number | null} [toolIndex]
 */

/**
 * @typedef {Object} AiChatDone
 * @property {string} reply
 * @property {number} sessionId
 * @property {number} assistantMessageId
 * @property {number} userMessageId
 * @property {string} roundAction
 * @property {unknown} [planProposal]
 */

function parseSseChunk(part) {
  const lines = part.split('\n')
  let eventName = 'message'
  let dataLine = ''
  for (const line of lines) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLine += line.slice(5).trim()
  }
  if (!dataLine) return null
  return { eventName, dataLine }
}

function drainSseBuffer(buffer, handlers) {
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const part of parts) {
    const parsed = parseSseChunk(part)
    if (!parsed) continue
    const { eventName, dataLine } = parsed
    try {
      if (eventName === 'progress') {
        handlers.onProgress(JSON.parse(dataLine))
      } else if (eventName === 'done') {
        handlers.onDone(JSON.parse(dataLine))
      } else if (eventName === 'error') {
        const o = JSON.parse(dataLine)
        handlers.onError(o.message ?? '请求失败')
      }
    } catch (e) {
      console.warn('SSE parse error', e, dataLine)
    }
  }
  return rest
}

function canUseFetchStream() {
  if (typeof fetch !== 'function') return false
  try {
    return typeof ReadableStream !== 'undefined'
  } catch (e) {
    return false
  }
}

function canUseUniChunked() {
  // #ifdef MP-WEIXIN
  return typeof uni !== 'undefined' && typeof uni.request === 'function'
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

export function supportsChatStream() {
  return canUseFetchStream() || canUseUniChunked()
}

function fallbackChat(body, handlers) {
  return sendChatMessage(body.message, body.sessionId, body.provider)
    .then((res) => {
      handlers.onProgress({
        type: 'progress',
        code: 'ANALYZING',
        message: '正在理解您的问题…',
        phase: 'ROUTING',
        sessionId: res.sessionId ?? null,
        traceId: ''
      })
      handlers.onDone(res)
    })
}

function streamViaFetch(body, handlers, signal) {
  const token = getAccessToken()
  return fetch(`${BASE_URL}/api/v1/ai/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), {
        code: err.code || 'ERROR',
        message: err.message ?? `HTTP ${res.status}`
      })
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      buffer = drainSseBuffer(buffer, handlers)
    }
    if (buffer.trim()) drainSseBuffer(buffer + '\n\n', handlers)
  })
}

function arrayBufferToUtf8(buf) {
  if (!buf) return ''
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(buf)
  }
  const arr = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  try {
    return decodeURIComponent(escape(s))
  } catch (e) {
    return s
  }
}

function streamViaUniChunked(body, handlers, signal) {
  const token = getAccessToken()
  return new Promise((resolve, reject) => {
    let buffer = ''
    let settled = false
    const finish = (err) => {
      if (settled) return
      settled = true
      if (err) reject(err)
      else resolve()
    }

    const task = uni.request({
      url: `${BASE_URL}/api/v1/ai/chat/stream`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: body,
      enableChunked: true,
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          let msg = `HTTP ${res.statusCode}`
          try {
            const errBody = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            if (errBody && errBody.message) msg = errBody.message
          } catch (e) { /* ignore */ }
          finish({ code: 'ERROR', message: msg })
          return
        }
        if (!buffer && res.data) {
          buffer += arrayBufferToUtf8(res.data)
          buffer = drainSseBuffer(buffer, handlers)
        } else if (buffer.trim()) {
          buffer = drainSseBuffer(buffer + '\n\n', handlers)
        }
        finish()
      },
      fail: (err) => {
        if (signal && signal.aborted) {
          handlers.onError('已取消')
          finish()
          return
        }
        finish({ code: 'NETWORK_ERROR', message: (err && err.errMsg) || '网络异常' })
      }
    })

    if (task && typeof task.onChunkReceived === 'function') {
      task.onChunkReceived((chunkRes) => {
        buffer += arrayBufferToUtf8(chunkRes.data)
        buffer = drainSseBuffer(buffer, handlers)
      })
    }

    if (signal) {
      const onAbort = () => {
        try {
          task.abort()
        } catch (e) { /* ignore */ }
        handlers.onError('已取消')
        finish()
      }
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

/**
 * @param {{ message: string; sessionId?: number; provider?: string; imageAssetIds?: number[] }} body
 * @param {{ onProgress: (e: AiChatProgressEvent) => void; onDone: (r: AiChatDone) => void; onError: (msg: string) => void }} handlers
 * @param {AbortSignal} [signal]
 */
export function sendChatStream(body, handlers, signal) {
  const payload = { message: body.message }
  if (body.sessionId != null) payload.sessionId = body.sessionId
  if (body.provider) payload.provider = body.provider
  if (body.imageAssetIds && body.imageAssetIds.length) payload.imageAssetIds = body.imageAssetIds

  let doneCalled = false
  const wrap = {
    onProgress: (e) => handlers.onProgress(e),
    onDone: (r) => {
      if (doneCalled) return
      doneCalled = true
      handlers.onDone(r)
    },
    onError: (msg) => {
      if (doneCalled) return
      handlers.onError(msg)
    }
  }

  const run = () => {
    if (canUseFetchStream()) return streamViaFetch(payload, wrap, signal)
    if (canUseUniChunked()) return streamViaUniChunked(payload, wrap, signal)
    return fallbackChat(payload, wrap)
  }

  return run().catch((e) => {
    if (signal && signal.aborted) {
      wrap.onError('已取消')
      return
    }
    if (e && e.code === 'UNAUTHORIZED') throw e
    if (!doneCalled) wrap.onError((e && e.message) || '请求失败')
  })
}
