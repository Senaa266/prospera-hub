import type { ChatProvider, ChatRequest, ChatStreamEvent, ChatTrackerPayload } from '../types/chat.ts'
import { buildLocalCoachReply } from '../lib/senaLocalCoach.js'

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:5000')

/**
 * Parses a buffered SSE chunk list into typed events.
 */
function consumeSseBuffer(
  buffer: string,
  chunk: string,
): { events: ChatStreamEvent[]; rest: string } {
  const combined = buffer + chunk
  const parts = combined.split('\n\n')
  const rest = parts.pop() ?? ''
  const events: ChatStreamEvent[] = []

  for (const part of parts) {
    const line = part
      .split('\n')
      .find((entry) => entry.startsWith('data:'))
    if (!line) continue
    const json = line.slice(5).trim()
    if (!json || json === '[DONE]') {
      events.push({ done: true })
      continue
    }
    try {
      events.push(JSON.parse(json) as ChatStreamEvent)
    } catch {
      // Ignore a partial or malformed frame; the next read may complete it.
    }
  }

  return { events, rest }
}

export type StreamChatOptions = {
  token: string
  signal?: AbortSignal
  onDelta: (text: string) => void
  onProvider?: (provider: ChatProvider) => void
  onTracker?: (tracker: ChatTrackerPayload) => void
}

async function streamLocalFallback(
  payload: ChatRequest,
  options: StreamChatOptions,
  noticeProvider: ChatProvider = 'local',
): Promise<void> {
  options.onProvider?.(noticeProvider)
  const reply = buildLocalCoachReply(payload.messages || [], payload.userContext)
  const parts = reply.split(/(\s+)/)
  for (const part of parts) {
    if (!part) continue
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    options.onDelta(part)
    await new Promise((resolve) => window.setTimeout(resolve, 10))
  }
}

/**
 * Streams Sena's reply from POST /api/ai/chat.
 * Falls back to the on-device coach when the API is unreachable.
 */
export async function streamChatCompletion(
  payload: ChatRequest,
  options: StreamChatOptions,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.token}`,
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    await streamLocalFallback(payload, options)
    return
  }

  if (!response.ok) {
    // Prefer local coaching over a dead-end error when the server rejects the call.
    if (response.status >= 500 || response.status === 401 || response.status === 404) {
      await streamLocalFallback(payload, options)
      return
    }
    let message = 'Sena is unavailable right now. Please try again.'
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) message = data.message
    } catch {
      // Keep the safe fallback message.
    }
    throw new Error(message)
  }

  if (!response.body) {
    await streamLocalFallback(payload, options)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const parsed = consumeSseBuffer(buffer, chunk)
    buffer = parsed.rest
    for (const event of parsed.events) {
      if (event.done) continue
      if (event.error) throw new Error(event.error)
      if (event.provider) options.onProvider?.(event.provider)
      if (event.tracker) options.onTracker?.(event.tracker)
      if (event.content) options.onDelta(event.content)
    }
  }

  if (buffer.trim()) {
    const parsed = consumeSseBuffer(buffer, '\n\n')
    for (const event of parsed.events) {
      if (event.error) throw new Error(event.error)
      if (event.provider) options.onProvider?.(event.provider)
      if (event.tracker) options.onTracker?.(event.tracker)
      if (event.content) options.onDelta(event.content)
    }
  }
}
