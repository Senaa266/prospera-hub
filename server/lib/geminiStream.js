const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_TIMEOUT_MS = 40_000

/**
 * Maps Prospera chat turns to Gemini's user/model content list.
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
 */
export function toGeminiContents(messages) {
  return messages.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }))
}

/**
 * Reads one SSE `data:` JSON object from a Gemini stream chunk.
 * @param {string} buffer
 * @param {string} chunk
 */
function consumeSse(buffer, chunk) {
  const combined = buffer + chunk
  const parts = combined.split('\n\n')
  const rest = parts.pop() ?? ''
  const texts = []

  for (const part of parts) {
    const line = part.split('\n').find((entry) => entry.startsWith('data:'))
    if (!line) continue
    const json = line.slice(5).trim()
    if (!json) continue
    try {
      const payload = JSON.parse(json)
      const delta = payload?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof delta === 'string' && delta) texts.push(delta)
    } catch {
      // Partial frame; wait for the next read.
    }
  }

  return { texts, rest }
}

/**
 * Streams a Gemini reply and invokes onDelta for each text chunk.
 * @param {{ systemInstruction: string, messages: Array<{ role: string, content: string }>, onDelta: (text: string) => void }} options
 */
export async function streamGeminiChat({ systemInstruction, messages, onDelta }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw Object.assign(new Error('Gemini is not configured'), { status: 503 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200)
      console.error('[ai.chat] gemini_http', response.status)
      throw Object.assign(new Error('Sena is unavailable right now. Please try again.'), {
        status: response.status >= 500 ? 502 : 400,
        detail,
      })
    }

    if (!response.body) {
      throw Object.assign(new Error('Sena is unavailable right now. Please try again.'), {
        status: 502,
      })
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let received = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const parsed = consumeSse(buffer, decoder.decode(value, { stream: true }))
      buffer = parsed.rest
      for (const text of parsed.texts) {
        received = true
        onDelta(text)
      }
    }

    if (!received) {
      throw Object.assign(new Error('Sena returned an empty reply. Please try again.'), {
        status: 502,
      })
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(new Error('Sena timed out. Please try again.'), { status: 504 })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
