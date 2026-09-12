import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'prospera-preferences'

export const ACCENTS = [
  {
    id: 'rose',
    label: 'Prospera rose',
    prospera: '#f10178',
    dark: '#be004c',
    soft: '#fde7f2',
    softDark: '#3a1830',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    prospera: '#6366f1',
    dark: '#4338ca',
    soft: '#eef2ff',
    softDark: '#1e1f3d',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    prospera: '#059669',
    dark: '#047857',
    soft: '#ecfdf5',
    softDark: '#12352c',
  },
  {
    id: 'amber',
    label: 'Amber',
    prospera: '#d97706',
    dark: '#b45309',
    soft: '#fffbeb',
    softDark: '#3a2a12',
  },
]

export const WALLPAPERS = [
  {
    id: 'none',
    label: 'Clean canvas',
    preview: 'none',
    previewDark: 'none',
    swatch: 'linear-gradient(180deg, #f6f6fa, #e8e8f0)',
    swatchDark: 'linear-gradient(180deg, #1a1a22, #121218)',
  },
  {
    id: 'soft-mesh',
    label: 'Soft mesh',
    preview:
      'radial-gradient(circle at 18% 18%, rgba(241,1,120,0.28), transparent 42%), radial-gradient(circle at 82% 8%, rgba(99,102,241,0.26), transparent 40%), radial-gradient(circle at 50% 90%, rgba(241,1,120,0.12), transparent 45%)',
    previewDark:
      'radial-gradient(circle at 18% 18%, rgba(241,1,120,0.42), transparent 42%), radial-gradient(circle at 82% 8%, rgba(99,102,241,0.38), transparent 40%), radial-gradient(circle at 50% 90%, rgba(241,1,120,0.2), transparent 45%)',
    swatch:
      'radial-gradient(circle at 18% 18%, rgba(241,1,120,0.28), transparent 42%), radial-gradient(circle at 82% 8%, rgba(99,102,241,0.26), transparent 40%), #f3f0f8',
    swatchDark:
      'radial-gradient(circle at 18% 18%, rgba(241,1,120,0.42), transparent 42%), radial-gradient(circle at 82% 8%, rgba(99,102,241,0.38), transparent 40%), #121218',
  },
  {
    id: 'market-dawn',
    label: 'Market dawn',
    preview: 'linear-gradient(135deg, #fff4e5 0%, #ffd6ea 42%, #dfe6ff 100%)',
    previewDark: 'linear-gradient(135deg, #2a1a18 0%, #3a1830 42%, #1a2038 100%)',
    swatch: 'linear-gradient(135deg, #fff4e5 0%, #ffd6ea 42%, #dfe6ff 100%)',
    swatchDark: 'linear-gradient(135deg, #2a1a18 0%, #3a1830 42%, #1a2038 100%)',
  },
  {
    id: 'kente-lines',
    label: 'Kente lines',
    preview:
      'repeating-linear-gradient(90deg, rgba(241,1,120,0.18) 0 14px, transparent 14px 30px), repeating-linear-gradient(0deg, rgba(99,102,241,0.14) 0 12px, transparent 12px 26px)',
    previewDark:
      'repeating-linear-gradient(90deg, rgba(241,1,120,0.32) 0 14px, transparent 14px 30px), repeating-linear-gradient(0deg, rgba(99,102,241,0.26) 0 12px, transparent 12px 26px)',
    swatch:
      'repeating-linear-gradient(90deg, rgba(241,1,120,0.18) 0 14px, transparent 14px 30px), repeating-linear-gradient(0deg, rgba(99,102,241,0.14) 0 12px, transparent 12px 26px), #f7f4fb',
    swatchDark:
      'repeating-linear-gradient(90deg, rgba(241,1,120,0.32) 0 14px, transparent 14px 30px), repeating-linear-gradient(0deg, rgba(99,102,241,0.26) 0 12px, transparent 12px 26px), #121218',
  },
]

export const LANGUAGES = [
  { id: 'en-GH', label: 'English (Ghana)' },
  { id: 'en-NG', label: 'English (Nigeria)' },
  { id: 'fr-SN', label: 'Français (Sénégal)' },
  { id: 'sw-KE', label: 'Kiswahili (Kenya)' },
  { id: 'tw-GH', label: 'Twi (Ghana)' },
]

export const REGIONS = [
  { id: 'GH', label: 'Ghana · GHS' },
  { id: 'NG', label: 'Nigeria · NGN' },
  { id: 'KE', label: 'Kenya · KES' },
  { id: 'SN', label: 'Sénégal · XOF' },
  { id: 'ZA', label: 'South Africa · ZAR' },
]

const DEFAULTS = {
  theme: 'light',
  accent: 'rose',
  wallpaper: 'none',
  language: 'en-GH',
  region: 'GH',
  notifications: {
    grants: true,
    savings: true,
    suppliers: true,
    sena: true,
    emailDigest: false,
  },
  accessibility: {
    largeText: false,
    reduceMotion: false,
    highContrast: false,
  },
}

function loadPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications }, accessibility: { ...DEFAULTS.accessibility } }
    return {
      ...DEFAULTS,
      ...parsed,
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications || {}) },
      accessibility: { ...DEFAULTS.accessibility, ...(parsed.accessibility || {}) },
    }
  } catch {
    return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications }, accessibility: { ...DEFAULTS.accessibility } }
  }
}

function applyDomPreferences(prefs) {
  const root = document.documentElement
  const accent = ACCENTS.find((item) => item.id === prefs.accent) || ACCENTS[0]
  const wallpaper = WALLPAPERS.find((item) => item.id === prefs.wallpaper) || WALLPAPERS[0]
  const isDark = prefs.theme === 'dark'
  const soft = isDark ? accent.softDark : accent.soft
  const paper = isDark ? wallpaper.previewDark || wallpaper.preview : wallpaper.preview

  root.dataset.theme = prefs.theme
  root.dataset.accent = accent.id
  root.dataset.wallpaper = wallpaper.id
  root.dataset.largeText = prefs.accessibility.largeText ? 'true' : 'false'
  root.dataset.reduceMotion = prefs.accessibility.reduceMotion ? 'true' : 'false'
  root.dataset.highContrast = prefs.accessibility.highContrast ? 'true' : 'false'
  root.style.setProperty('--color-prospera', accent.prospera)
  root.style.setProperty('--color-prospera-dark', accent.dark)
  root.style.setProperty('--color-prospera-soft', soft)
  root.style.setProperty('--app-wallpaper', paper)
}

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences)

  useEffect(() => {
    applyDomPreferences(preferences)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const updatePreferences = useCallback((patch) => {
    setPreferences((current) => ({ ...current, ...patch }))
  }, [])

  const updateNotifications = useCallback((patch) => {
    setPreferences((current) => ({
      ...current,
      notifications: { ...current.notifications, ...patch },
    }))
  }, [])

  const updateAccessibility = useCallback((patch) => {
    setPreferences((current) => ({
      ...current,
      accessibility: { ...current.accessibility, ...patch },
    }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences({
      ...DEFAULTS,
      notifications: { ...DEFAULTS.notifications },
      accessibility: { ...DEFAULTS.accessibility },
    })
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      updateNotifications,
      updateAccessibility,
      resetPreferences,
    }),
    [preferences, updatePreferences, updateNotifications, updateAccessibility, resetPreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider')
  return context
}
