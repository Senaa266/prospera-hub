import { db } from './db.js'
import { aiConfigured, classifyGrants } from './ai.js'

const FEEDS = [
  'https://opportunitydesk.org/category/search-by-region/africa/feed/',
  'https://opportunitydesk.org/category/awards-and-grants/grants/feed/',
]

const TTL_MS = 6 * 60 * 60 * 1000
const KEY_LAST = 'grants_fetched_at'

const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

const BLOCK_HOST = /(docs\.google|drive\.google|storage\.googleapis|dropbox|forms\.gle|cloudinary|twitter\.com|x\.com|facebook\.com|linkedin\.com|instagram\.com|youtube\.com|youtu\.be|tumblr\.com|t\.me|whatsapp|wa\.me|tg\.me|bit\.ly|goo\.gl|tinyurl|t\.co|mailarchive|\.wp\.com|wordpress|gravatar)/i
const SAME_HOST = /opportunitydesk\.org/i

let refreshing = null

function faviconFor(host) {
  if (!host) return null
  return `https://icons.duckduckgo.com/ip3/${host}.ico`
}

function stripHtml(html) {
  return (html || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&euro;/gi, '€')
    .replace(/&pound;/gi, '£')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&hellip;|&#8230;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/\uFFFD/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function itemsFromRss(xml) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml))) {
    const body = m[1]
    const node = (tag) => {
      const match = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return match ? stripHtml(match[1]) : ''
    }
    items.push({ title: node('title'), link: node('link'), desc: node('description') })
  }
  return items
}

export function parseDeadline(text) {
  const t = (text || '').slice(0, 400)
  const m = t.match(/Deadline:\s*([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,*\s*(\d{2,4}))?/i)
  if (m) {
    const month = MON[m[1].slice(0, 3).toLowerCase()]
    if (month) {
      let year = m[3]
      if (!year) year = String(new Date().getFullYear())
      if (year.length === 2) year = `20${year}`
      return `${year}-${String(month).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`
    }
  }
  return 'Rolling'
}

export function parseAmount(text) {
  const t = text || ''
  const re = /(?:up to\s+)?((?:US\s*\$|USD|GHS|GH₵|GH¢|₦|NGN|KES|EUR|€|£|KSh|\$)\s*\d[\d.,]*(?:\s*(?:million|bn|k|m))?)/i
  const m = t.match(re)
  if (!m) return { amount: null, amountMax: null }
  const raw = m[1].replace(/\s+/g, ' ')
  const value = parseFloat(raw.replace(/[^\d.]/g, ''))
  const suffix = (raw.match(/(million|bn|k|m)\b/i) || [])[1]?.toLowerCase()
  if (suffix === 'million' || suffix === 'm') return { amount: raw, amountMax: value * 1e6 }
  if (suffix === 'bn') return { amount: raw, amountMax: value * 1e9 }
  if (suffix === 'k') return { amount: raw, amountMax: value * 1e3 }
  return { amount: raw, amountMax: value }
}

export function inferType(text) {
  const t = text.toLowerCase()
  if (/\b(woman|women|female|she)\b/.test(t)) return 'Women-led'
  if (/(agri|farm|farmer|agriculture)/.test(t)) return 'Agri-business'
  if (/(tech|fintech|digital|\bai\b|software|startup|innovation|app|platform|climate)/.test(t)) return 'Tech / Innovation'
  if (/(creative|music|film|media|artist|story)/.test(t)) return 'Creative'
  return 'All sectors'
}

function grantsFreshEnough() {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(KEY_LAST)
  if (!row) return false
  const at = Number(row.value)
  return Number.isFinite(at) && Date.now() - at < TTL_MS
}

async function fetchText(url, ms = 12000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ProsperaHub/1.0)' },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

async function parallel(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const idx = next
      next += 1
      out[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

function extractFunder(html, sameHost) {
  let og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
  og = og || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
  const ogImage = og ? og[1].split(' ')[0] : null

  const counts = new Map()
  let m
  const re = /href="(https?:\/\/[^"?#]+)/gi
  while ((m = re.exec(html)) && counts.size < 40) {
    try {
      const u = new URL(m[1])
      if (u.hostname === sameHost || SAME_HOST.test(u.hostname) || BLOCK_HOST.test(u.hostname)) continue
      counts.set(u.hostname, (counts.get(u.hostname) || 0) + 1)
    } catch {
      /* skip malformed link */
    }
  }

  let funderHost = null
  let best = 0
  for (const [host, n] of counts) {
    if (n > best) {
      best = n
      funderHost = host
    }
  }
  return { ogImage, funderHost }
}

async function enrich(row) {
  const sameHost = new URL(row.link).hostname
  try {
    const html = await fetchText(row.link)
    const { ogImage, funderHost } = extractFunder(html, sameHost)
    row.funder = funderHost ? `https://${funderHost}` : row.link
    row.image = ogImage || faviconFor(funderHost || sameHost)
  } catch {
    row.funder = row.link
    row.image = faviconFor(sameHost)
  }
  return row
}

export async function refreshGrantsIfStale() {
  if (refreshing) return refreshing
  if (grantsFreshEnough()) return null
  refreshing = (async () => {
    try {
      await refreshGrants()
    } catch (err) {
      console.error('[scraper] refresh failed:', err.message)
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function refreshGrants() {
  const seen = new Set()
  const rows = []

  for (const url of FEEDS) {
    for (let page = 1; page <= 5; page += 1) {
      const pageUrl = page === 1 ? url : `${url}?paged=${page}`
      const xml = await fetchText(pageUrl)
      const items = itemsFromRss(xml)
      if (items.length === 0) break

      for (const item of items) {
        if (!item.title || !item.link || seen.has(item.link)) continue
        const title = item.title
        const hay = `${title} ${item.desc}`.slice(0, 320)

        if (/^\d+,?\d*\s+(grant|opportun|funding|scholar|award)/i.test(title)) continue
        if (/\b(scholarship|fellowship|internship|bursary|research|phd|academic|essay|study|university|college|conference|webinar|workshop|summit|vacancy|call for papers)\b/i.test(title)) continue
        if (/\b(donate|donation|give today|donate now|contribute|contribution|support us|membership)\b/i.test(item.desc)) continue

        const hasMoney = /(?:up to\s+)?(?:[€£₦$\u20A6\u20B9]\s*\d{2,}|(?:US\s*\$|USD|GHS|KES|NGN|EUR)\s*\d)/i.test(hay)
        const hasFund = /\b(grant|microgrant|accelerator|loan|investment|equity|startup|entrepreneur|incubator|bootcamp|seed)\b/i.test(hay)
        if (!hasMoney && !hasFund) continue
        seen.add(item.link)

        const { amount, amountMax } = parseAmount(hay)
        rows.push({
          title: item.title,
          link: item.link,
          desc: item.desc,
          amount,
          amountMax,
          deadline: parseDeadline(item.desc),
          type: inferType(hay),
          region: url.includes('search-by-region') ? 'Africa' : 'Global',
        })
      }

      if (items.length < 10) break
    }
  }

  if (rows.length === 0) throw new Error('no fresh grants parsed')

  const enriched = await parallel(rows, 6, enrich)

  let finalRows = enriched
  if (aiConfigured()) {
    try {
      const accepted = await classifyGrants(
        enriched.map((r) => ({ article: r.link, title: r.title, desc: r.desc, funder: r.funder }))
      )
      if (accepted.length > 0) {
        const byArticle = new Map(enriched.map((r) => [r.link, r]))
        finalRows = accepted
          .map((a) => {
            const r = byArticle.get(a.article)
            if (!r) return null
            return { ...r, source: a.org || r.source, externalUrl: a.officialUrl || r.funder }
          })
          .filter(Boolean)
        console.log(`[scraper] AI kept ${finalRows.length} of ${enriched.length} candidates`)
      } else {
        console.warn('[scraper] AI rejected every candidate — keeping heuristic list')
      }
    } catch (err) {
      console.error('[scraper] AI classification failed — using heuristic list:', err.message)
    }
  } else {
    console.info('[scraper] No AI key set — heuristic filtering only')
  }

  const stamp = Date.now()
  const nowIso = new Date(stamp).toISOString()
  const ins = db.prepare(
    `INSERT INTO grants (title, amount, amount_max, description, eligibility, deadline, type, region, source, external_url, image_url, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM grants')
    for (const r of finalRows) {
      ins.run(
        r.title.slice(0, 300),
        r.amount,
        r.amountMax,
        r.desc.slice(0, 420),
        null,
        r.deadline,
        r.type,
        r.region,
        r.source || 'Opportunity Desk',
        r.externalUrl || r.funder,
        r.image,
        nowIso
      )
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
      KEY_LAST,
      String(stamp)
    )
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  console.log(`[scraper] refreshed ${finalRows.length} live grants from the web`)
  return finalRows.length
}