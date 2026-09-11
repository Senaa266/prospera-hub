import { db } from '../db.js'
import { refreshGrantsIfStale } from '../scraper.js'

function faviconFor(url) {
  if (!url) return null
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return null
  }
}

export async function listGrants(req, res) {
  try {
    await refreshGrantsIfStale()

    const rows = db
      .prepare('SELECT * FROM grants ORDER BY (deadline = ?) ASC, date(deadline) ASC, id ASC')
      .all('Rolling')

    const live = rows.some((g) => g.fetched_at)

    const grants = rows.map((g) => ({
      id: g.id,
      title: g.title,
      amount: g.amount,
      amountMax: g.amount_max,
      description: g.description,
      eligibility: g.eligibility,
      deadline: g.deadline,
      type: g.type,
      region: g.region,
      source: g.source,
      externalUrl: g.external_url,
      imageUrl: g.image_url,
      image: g.image_url || faviconFor(g.external_url),
    }))

    res.json({ grants, live })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}