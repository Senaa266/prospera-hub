const GEMINI_TIMEOUT_MS = 40_000

function resolveGeminiModels() {
  return [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3-flash-preview',
  ].filter((name, index, list) => Boolean(name) && list.indexOf(name) === index)
}

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
 * @param {string} buffer
 * @param {string} chunk
 */
function consumeSse(buffer, chunk) {
  const combined = `${buffer}${chunk}`.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const parts = combined.split('\n\n')
  const rest = parts.pop() ?? ''
  const texts = []

  for (const frame of parts) {
    const line = frame.split('\n').find((entry) => entry.startsWith('data:'))
    if (!line) continue
    const json = line.slice(5).trim()
    if (!json) continue
    try {
      const payload = JSON.parse(json)
      const contentParts = payload?.candidates?.[0]?.content?.parts
      if (!Array.isArray(contentParts)) continue
      for (const part of contentParts) {
        if (part?.thought === true) continue
        if (typeof part?.text === 'string' && part.text) texts.push(part.text)
      }
    } catch {
      // Partial frame; wait for the next read.
    }
  }

  return { texts, rest }
}

/**
 * @param {string} apiKey
 * @param {string} model
 * @param {string} systemInstruction
 * @param {Array<{ role: string, content: string }>} messages
 * @param {AbortSignal} signal
 */
async function requestGemini(apiKey, model, systemInstruction, messages, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingLevel: 'MINIMAL',
        },
      },
    }),
  })
}

/**
 * Streams a Gemini reply. Tries a few model IDs if the first is unavailable.
 * @param {{ apiKey: string, systemInstruction: string, messages: Array<{ role: string, content: string }>, onDelta: (text: string) => void }} options
 */
export async function streamGeminiChat({ apiKey, systemInstruction, messages, onDelta }) {
  if (!apiKey) {
    throw Object.assign(new Error('Gemini is not configured'), { status: 503 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)
  let lastStatus = 0

  try {
    for (const model of resolveGeminiModels()) {
      const response = await requestGemini(
        apiKey,
        model,
        systemInstruction,
        messages,
        controller.signal,
      )
      lastStatus = response.status
      if (response.status === 404) continue
      if (!response.ok) {
        console.error('[ai.chat] gemini_http', response.status)
        throw Object.assign(new Error('Sena could not reach Gemini. Please try again.'), {
          status: response.status >= 500 ? 502 : 400,
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
        if (done) {
          const parsed = consumeSse(buffer, '\n\n')
          buffer = parsed.rest
          for (const text of parsed.texts) {
            received = true
            onDelta(text)
          }
          break
        }
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
      return
    }

    throw Object.assign(
      new Error(`Sena could not find a working Gemini model (last status ${lastStatus}).`),
      { status: 502 },
    )
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(new Error('Sena timed out. Please try again.'), { status: 504 })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
