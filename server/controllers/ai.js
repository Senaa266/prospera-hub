import OpenAI from 'openai'
import { chatRequestSchema } from '../lib/chatSchema.js'
import { PROSPERA_SYSTEM_PROMPT } from '../lib/prompts/prosperaSystemPrompt.js'

const MODEL = 'gpt-4o'

/**
 * Appends verified user context to the system prompt. Missing fields stay omitted.
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
 * Offline / unconfigured reply that still honours Sena's scope rules.
 * @param {string} userText
 * @param {{ financialSnapshot?: object } | undefined} userContext
 * @returns {string}
 */
export function buildFallbackReply(userText, userContext) {
  const text = userText.toLowerCase()

  if (
    /system prompt|ignore (all|previous) instructions|reveal your instructions/.test(text)
  ) {
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

  if (
    /revenue|profit|expense|cash ?flow|margin|sales figure|how much did i/.test(text) &&
    !userContext?.financialSnapshot
  ) {
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
 * Streams plain text in small chunks so the UI can render token-by-token without a key.
 * @param {import('express').Response} res
 * @param {string} text
 * @returns {Promise<void>}
 */
async function streamPlainText(res, text) {
  const parts = text.split(/(\s+)/)
  for (const part of parts) {
    if (!part) continue
    writeSse(res, { content: part })
    await new Promise((resolve) => setTimeout(resolve, 12))
  }
  writeSse(res, { done: true })
  res.end()
}

/**
 * POST /api/ai/chat — streams Sena's reply via SSE.
 * Never logs full message contents.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function chat(req, res) {
  const parsed = chatRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid chat request' })
  }

  const { messages, userContext } = parsed.data
  const lastUser = [...messages].reverse().find((item) => item.role === 'user')

  console.info('[ai.chat]', {
    messageCount: messages.length,
    hasContext: Boolean(userContext),
  })

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    setSseHeaders(res)
    return streamPlainText(res, buildFallbackReply(lastUser?.content ?? '', userContext))
  }

  try {
    const openai = new OpenAI({ apiKey })
    const stream = await openai.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: 'system', content: buildSystemMessage(userContext) },
        ...messages.map((item) => ({ role: item.role, content: item.content })),
      ],
    })

    setSseHeaders(res)

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) writeSse(res, { content: delta })
    }

    writeSse(res, { done: true })
    res.end()
  } catch {
    console.error('[ai.chat] provider_error')
    if (res.headersSent) {
      writeSse(res, { error: 'Sena is unavailable right now. Please try again.' })
      res.end()
      return
    }
    return res.status(500).json({
      message: 'Sena is unavailable right now. Please try again.',
    })
  }
}
