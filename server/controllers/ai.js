import OpenAI from 'openai'
import { chatRequestSchema } from '../lib/chatSchema.js'
import { PROSPERA_SYSTEM_PROMPT } from '../lib/prompts/prosperaSystemPrompt.js'
import { getFinanceSnapshot } from './finance.js'
import { streamGeminiChat } from '../lib/geminiStream.js'

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
 * Local Sena reply when no live provider key is set, so the chat still works.
 * @param {string} userText
 * @param {{ financialSnapshot?: object, name?: string } | undefined} userContext
 */
export function buildFallbackReply(userText, userContext) {
  const text = userText.toLowerCase().trim()
  const name = userContext?.name ? ` ${userContext.name.split(' ')[0]}` : ''

  if (/^(hi|hello|hey|good (morning|afternoon|evening)|howdy)\b/.test(text)) {
    return `Hi${name} — I'm Sena, your Prospera business coach.\n\nI can help you price a product, turn an idea into a 90-day plan, read your books, or find a grant fit.\n\nWhat are you working on today?`
  }

  if (/system prompt|ignore (all|previous) instructions|reveal your instructions/.test(text)) {
    return "That's outside what I can help with as your business coach. I focus on strategy, finance, and Prospera — want to talk about pricing, a 90-day plan, or reading your records?"
  }

  if (
    /weather|football|soccer|movie|dating|boyfriend|girlfriend|recipe|celebrity|election|politics/.test(
      text,
    )
  ) {
    return "That's outside what I can help with as your business coach. I focus on strategy, finance, and Prospera — want to talk about pricing your products or mapping a first 90 days?"
  }

  if (/tax|lawyer|legal advice|sue|court|investment return|stock|crypto/.test(text)) {
    return `I can share general business education, not licensed legal, tax, or investment advice.\n\nThis is educational guidance — please consult a licensed professional for your specific situation.\n\nIf helpful, I can walk through record-keeping, pricing, or how Prospera's Investor & Grant Matchmaking Hub works. What would you like to focus on?`
  }

  if (/revenue|profit|expense|cash ?flow|margin|sales figure|how much did i/.test(text)) {
    const snapshot = userContext?.financialSnapshot
    if (snapshot) {
      const unit = snapshot.currency ? `${snapshot.currency} ` : ''
      return `Looking at your logged books only — I will not invent extra figures.\n\n- Revenue: ${unit}${snapshot.revenue}\n- Expenses: ${unit}${snapshot.expenses}\n- Profit: ${unit}${snapshot.profit}\n${snapshot.notes ? `- ${snapshot.notes}` : ''}\n\nCash looks ${Number(snapshot.profit) >= 0 ? 'positive' : 'tight'}. Want a simple 30-day cash-flow plan from here?`
    }

    return `I don't have your logged numbers yet, so I won't guess.\n\nCould you tell me:\n1. Your currency and last 30 days of revenue and expenses, or\n2. Confirm you've saved them on the Finance page so I can read that snapshot?\n\nOnce I have those, I can spot cash-flow patterns and suggest a next step.`
  }

  if (/susu|stokvel|sacco|group saving/.test(text)) {
    return `Great question! Let's map this out. First, we'll treat susu / stokvel as a discipline tool, not free money.\n\n1. Agree the contribution, payout order, and what happens if someone misses a week.\n2. Keep every payment visible — Prospera's Susu circles show who has paid.\n3. Don't commit more than your slowest sales week can cover.\n4. Use the payout for stock or a documented goal, not informal lending you can't track.\n\nAre you joining an existing circle or starting one, and what's your weekly contribution target?`
  }

  if (/price|pricing|charge|how much should i/.test(text)) {
    return `Great question! Let's map this out. First, we'll keep pricing simple and local.\n\n1. Add up materials, airtime/data, transport, and your time.\n2. Check what nearby sellers charge — market stalls, WhatsApp groups, Jumia, or Instagram.\n3. Set a floor (cost + a living margin) and a stretch price for custom or rush work.\n4. Test for two weeks and adjust. Mobile money (MoMo, M-Pesa) makes small price tests easy.\n\nWhat's your product, country, and typical cost to make one unit?`
  }

  return `Great question! Let's map this out. First, we'll keep this practical.\n\nI can help with a startup blueprint, pricing, validating an idea, reading your books, or Prospera features like the Investor & Grant Matchmaking Hub and MTN MoMo / Absa integrations.\n\nTell me your country, what you sell (or want to sell), and whether you want a short answer or a 90-day plan.`
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
async function streamPlainText(res, text) {
  const parts = text.split(/(\s+)/)
  for (const part of parts) {
    if (!part) continue
    writeSse(res, { content: part })
    await new Promise((resolve) => setTimeout(resolve, 12))
  }
}

/**
 * Streams via OpenAI when Gemini is not configured.
 * @param {import('express').Response} res
 * @param {string} system
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
 */
async function streamOpenAiChat(res, system, messages) {
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
    if (delta) writeSse(res, { content: delta })
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
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim())
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim())

  console.info('[ai.chat]', {
    messageCount: messages.length,
    hasContext: Boolean(userContext),
    provider: hasGemini ? 'gemini' : hasOpenAi ? 'openai' : 'none',
  })

  try {
    setSseHeaders(res)

    if (hasGemini) {
      await streamGeminiChat({
        systemInstruction: system,
        messages,
        onDelta: (text) => writeSse(res, { content: text }),
      })
    } else if (hasOpenAi) {
      await streamOpenAiChat(res, system, messages)
    } else {
      const lastUser = [...messages].reverse().find((item) => item.role === 'user')
      await streamPlainText(res, buildFallbackReply(lastUser?.content ?? '', userContext))
    }

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
