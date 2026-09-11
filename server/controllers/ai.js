import OpenAI from 'openai'
import { chatRequestSchema } from '../lib/chatSchema.js'
import { PROSPERA_SYSTEM_PROMPT } from '../lib/prompts/prosperaSystemPrompt.js'
import { getFinanceSnapshot } from './finance.js'
import { streamGeminiChat } from '../lib/geminiStream.js'
import { buildLocalCoachReply } from '../lib/senaLocalCoach.js'
import { getAiProviders } from '../lib/loadEnv.js'
import { buildTrackerEvent } from '../lib/extractTracker.js'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Appends verified user context to Sena's system instruction.
 * @param {{ name?: string, country?: string, businessName?: string, financialSnapshot?: object } | undefined} userContext
 * @returns {string}
 */
export function buildSystemMessage(userContext) {
  if (!userContext) return PROSPERA_SYSTEM_PROMPT

  const lines = ['', 'USER CONTEXT (use only these facts; never invent missing fields):']
  if (userContext.name) lines.push(`- Name: ${userContext.name}`)
  if (userContext.country) lines.push(`- Country: ${userContext.country}`)
  if (userContext.businessName) lines.push(`- Business: ${userContext.businessName}`)
  if (userContext.financialSnapshot) {
    lines.push(
      `- Financial snapshot (user-logged only): ${JSON.stringify(userContext.financialSnapshot)}`,
    )
  }

  return lines.length > 2 ? `${PROSPERA_SYSTEM_PROMPT}\n${lines.join('\n')}` : PROSPERA_SYSTEM_PROMPT
}

/**
 * @param {import('express').Response} res
 * @param {object} payload
 */
function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

/**
 * @param {import('express').Response} res
 */
function setSseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders()
  }
}

/**
 * @param {import('express').Response} res
 * @param {string} text
 */
async function streamPlainText(res, text, onDelta) {
  const parts = text.split(/(\s+)/)
  for (const part of parts) {
    if (!part) continue
    onDelta(part)
    await new Promise((resolve) => setTimeout(resolve, 12))
  }
}

/**
 * Streams via OpenAI when Gemini is not configured.
 * @param {import('express').Response} res
 * @param {string} system
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
 */
async function streamOpenAiChat(res, system, messages, onDelta) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const openai = new OpenAI({ apiKey, timeout: 40_000 })
  const stream = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    stream: true,
    temperature: 0.7,
    max_tokens: 800,
    messages: [{ role: 'system', content: system }, ...messages],
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) onDelta(delta)
  }
}

/**
 * POST /api/ai/chat — live Gemini (preferred) or OpenAI stream. No mock replies.
 * Never logs full message contents. API keys stay on the server.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function chat(req, res) {
  const parsed = chatRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid chat request' })
  }

  const { messages, userContext: clientContext } = parsed.data
  const userContext = {
    ...clientContext,
    financialSnapshot: clientContext?.financialSnapshot || getFinanceSnapshot(req.user?.id),
  }
  const system = buildSystemMessage(userContext)
  const providers = getAiProviders()
  const provider = providers.gemini ? 'gemini' : providers.openai ? 'openai' : 'local'

  console.info('[ai.chat]', {
    messageCount: messages.length,
    hasContext: Boolean(userContext),
    provider,
  })

  try {
    setSseHeaders(res)
    writeSse(res, { provider })

    let reply = ''
    const onDelta = (text) => {
      reply += text
      writeSse(res, { content: text })
    }

    if (providers.gemini) {
      await streamGeminiChat({
        apiKey: providers.geminiKey,
        systemInstruction: system,
        messages,
        onDelta,
      })
    } else if (providers.openai) {
      await streamOpenAiChat(res, system, messages, onDelta)
    } else {
      await streamPlainText(res, buildLocalCoachReply(messages, userContext), onDelta)
    }

    const lastUser = [...messages].reverse().find((item) => item.role === 'user')
    const tracker = buildTrackerEvent(lastUser?.content || '', reply)
    if (tracker) writeSse(res, { tracker })

    writeSse(res, { done: true })
    res.end()
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Sena is unavailable right now. Please try again.'

    console.error('[ai.chat] provider_error')

    if (res.headersSent) {
      writeSse(res, { error: message })
      res.end()
      return
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({ message })
  }
}
