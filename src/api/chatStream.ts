import type { ChatRequest, ChatStreamEvent } from '../types/chat.ts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Parses a buffered SSE chunk list into typed events.
 * @param buffer - Raw text remaining from the previous read
 * @param chunk - Newly decoded stream text
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
}

/**
 * Streams Sena's reply from POST /api/ai/chat.
 * The OpenAI key never leaves the server — this client only sends messages.
 */
export async function streamChatCompletion(
  payload: ChatRequest,
  options: StreamChatOptions,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
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
    throw new Error('Sena is unavailable right now. Please try again.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const decoded = consumeSseBuffer(buffer, decoder.decode(value, { stream: true }))
    buffer = decoded.rest

    for (const event of decoded.events) {
      if (event.error) throw new Error(event.error)
      if (event.content) options.onDelta(event.content)
    }
  }
}
