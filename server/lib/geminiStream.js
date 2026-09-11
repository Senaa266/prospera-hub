const GEMINI_TIMEOUT_MS = 25_000
const GEMINI_FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest']
const RETRY_BACKOFF_MS = [600, 1500]

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
  const lines = combined.split(/\r?\n/)
  const rest = lines.pop() ?? ''
  const texts = []

  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    const json = line.replace(/^data:\s*/, '').trim()
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
 * Builds the ordered model list: configured/default first, then stable fallbacks.
 * @returns {string[]}
 */
function modelChain() {
  const primary = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash'
  return [primary, ...GEMINI_FALLBACK_MODELS].filter(
    (model, index, all) => model && all.indexOf(model) === index,
  )
}

function friendlyError(message, status) {
  return Object.assign(new Error(message), { status })
}

/**
 * Streams a Gemini reply and invokes onDelta for each text chunk.
 * Falls back across models and retries on quota/capacity errors (429, 5xx).
 * @param {{ systemInstruction: string, messages: Array<{ role: string, content: string }>, onDelta: (text: string) => void }} options
 */
export async function streamGeminiChat({ systemInstruction, messages, onDelta }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw friendlyError('Gemini is not configured.', 503)
  }

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }

  let lastError = null

  for (const model of modelChain()) {
    for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt += 1) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(body),
        })

        const handled = await tryStreamModel(response, model, onDelta)
        if (handled.ok) return
        if (handled.stop) throw handled.error
        lastError = handled.error
        if (attempt < RETRY_BACKOFF_MS.length) {
          await sleep(RETRY_BACKOFF_MS[attempt])
        }
      } catch (error) {
        cleanAbort(controller, timer)
        if (error?.name === 'AbortError') throw friendlyError('Sena timed out. Please try again.', 504)
        if (error?.stop) throw error
        lastError = error
        if (attempt < RETRY_BACKOFF_MS.length) {
          await sleep(RETRY_BACKOFF_MS[attempt])
        }
      } finally {
        cleanAbort(controller, timer)
      }
    }
  }

  throw lastError ?? friendlyError('Sena is unavailable right now. Please try again.', 502)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanAbort(controller, timer) {
  clearTimeout(timer)
  controller.abort()
}

/**
 * Attempts to consume one streamed response.
 * @returns {Promise<{ ok: boolean, stop?: boolean, error?: Error }>}
 */
async function tryStreamModel(response, model, onDelta) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200)
    const status = response.status
    console.error('[ai.chat] gemini_http', status, model, detail.slice(0, 120))

    if (status === 429 || status === 500 || status === 502 || status === 503) {
      return { ok: false, error: friendlyError('Sena is busy right now. Please try again.', status) }
    }
    if (status === 404) {
      // Model not found / retired — move to the next model.
      return { ok: false, stop: true, error: friendlyError('Sena is unavailable right now. Please try again.', 502) }
    }
    // 400 and friends: the request is wrong — do not retry anything.
    return { ok: false, stop: true, error: friendlyError('Sena is unavailable right now. Please try again.', 400) }
  }

  if (!response.body) {
    return { ok: false, stop: true, error: friendlyError('Sena is unavailable right now. Please try again.', 502) }
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
    return { ok: false, stop: true, error: friendlyError('Sena returned an empty reply. Please try again.', 502) }
  }

  return { ok: true }
}