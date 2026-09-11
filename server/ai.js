const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const CHUNK_SIZE = 60

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
}

const CHAT_SYSTEM =
  'You are "Prospera AI", the friendly assistant inside a business hub app for African entrepreneurs. Help with grants and funding, savings circles (susu), bulk supplier matching, and simple finance. Be concise and practical, use plain language, and end with one actionable next step.'

export async function chatReply(userMessage) {
  const prompt = `${CHAT_SYSTEM}\n\nUser: ${userMessage}\n\nAssistant:`
  const text = process.env.GEMINI_API_KEY ? await callGemini(prompt) : await callOpenAI(prompt)
  return text.trim().replace(/^Assistant:\s*/i, '')
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no text')
  return text
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned no text')
  return text
}

function parseJson(text) {
  const cleaned = (text || '').replace(/```json|```/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('could not parse AI JSON')
  }
}

function buildPrompt(items) {
  const payload = items.map((it) => ({
    id: it.article,
    title: it.title,
    description: (it.desc || '').slice(0, 300),
    url: it.funder,
  }))

  return `You filter grant listings for a business-funding app used by small business owners and startups in Africa.

I give you a JSON array of candidate opportunities scraped from a blog. For EACH one decide if it is a REAL funding opportunity that an entrepreneur can APPLY for and personally RECEIVE money from.

KEEP (${'accepted'}) items such as:
- startup/entrepreneur grants, micro-loans, accelerators and incubators that include funding
- business competitions with a real cash prize for founders
- equity-free funding for women-led or small businesses
- content or grant funds where a founder's business receives the money

REJECT items that are:
- donation appeals (an organisation asking visitors to give THEM money)
- scholarships, university/research programmes, fellowships, essay contests
- awards that are prestige/recognition only without cash going to the winner's business
- jobs, internships, volunteering
- grants open ONLY to non-profits, NGOs, charities or community/religious organisations (civic groups)
- conferences, webinars, training, mentorship with no funding
- roundup/listicle posts that just list many opportunities

Return ONLY a JSON object, no extra text:
{"accepted":[{"id":"<the original id>","kind":"grant","org":"funder/organisation name","officialUrl":"https://official funding page if present in item.url, else empty string","reason":"one short line"}]}

"officialUrl": only use item.url when it looks like the funder's own application page (starts with http). NEVER invent or guess URLs; otherwise empty string.
"reason": a short note like "Startup grant up to $50k, founders can apply".

Items:
${JSON.stringify(payload)}`
}

async function classifyChunk(items) {
  const prompt = buildPrompt(items)
  const text = process.env.GEMINI_API_KEY ? await callGemini(prompt) : await callOpenAI(prompt)
  const parsed = parseJson(text)
  const accepted = Array.isArray(parsed?.accepted) ? parsed.accepted : []
  return accepted
}

/**
 * Returns accepted items annotated with AI-provided title/org/link.
 * @param {Array<{article:string,title:string,desc:string,funder:string}>} items
 * @returns {Promise<Array<{article:string,org:string,officialUrl:string,reason:string}>>}
 */
export async function classifyGrants(items) {
  const chunks = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) chunks.push(items.slice(i, i + CHUNK_SIZE))

  const out = []
  for (const chunk of chunks) {
    const accepted = await classifyChunk(chunk)
    const byId = new Map(accepted.map((a) => [a.id, a]))
    for (const item of chunk) {
      const hit = byId.get(item.article)
      if (!hit) continue
      let officialUrl = ''
      if (typeof hit.officialUrl === 'string' && /^https?:\/\//i.test(hit.officialUrl.trim())) {
        try {
          const u = new URL(hit.officialUrl.trim())
          if (u.hostname) officialUrl = u.toString()
        } catch {
          officialUrl = ''
        }
      }
      if (!officialUrl && /^https?:\/\//i.test(item.funder || '')) officialUrl = item.funder
      out.push({
        article: item.article,
        org: String(hit.org || item.title || '').slice(0, 120),
        reason: String(hit.reason || '').slice(0, 200),
        officialUrl,
      })
    }
  }
  return out
}