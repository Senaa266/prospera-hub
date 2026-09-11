import { grants as grantsApi } from '../api/client'
import { DEMO_GRANTS } from '../data/grants'

export const favicon = (url) => {
  if (!url) return null
  try {
    return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`
  } catch {
    return null
  }
}

export const faviconGoogle = (url) => {
  if (!url) return null
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return null
  }
}

export const imageFor = (g) => g.image || g.imageUrl || favicon(g.externalUrl)

export function formatDeadline(date) {
  if (!date || date === 'Rolling') return 'Rolling'
  const d = new Date(date)
  if (isNaN(d)) return date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isUrgent(date) {
  if (!date || date === 'Rolling') return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 14
}

export async function loadGrants() {
  try {
    const token = localStorage.getItem('token')
    const data = await grantsApi.list(token)
    if (Array.isArray(data?.grants) && data.grants.length) {
      return { grants: data.grants, live: !!data.live }
    }
  } catch {
    /* offline fallback below */
  }
  return { grants: DEMO_GRANTS, live: false }
}