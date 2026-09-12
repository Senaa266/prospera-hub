import { useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/icons'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { useAuth } from '../context/AuthContext'
import {
  ACCENTS,
  LANGUAGES,
  REGIONS,
  WALLPAPERS,
  usePreferences,
} from '../context/PreferencesContext'

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'users' },
  { id: 'appearance', label: 'Appearance', icon: 'sliders' },
  { id: 'notifications', label: 'Notifications', icon: 'sparkles' },
  { id: 'accessibility', label: 'Accessibility', icon: 'shield' },
  { id: 'security', label: 'Security', icon: 'gear' },
]

const SESSION_SEED = [
  { id: 'sess-1', device: 'Chrome · Windows', location: 'Accra, Ghana', when: 'Active now', current: true },
  { id: 'sess-2', device: 'Safari · iPhone', location: 'Kumasi, Ghana', when: '2 hours ago', current: false },
  { id: 'sess-3', device: 'Chrome · Android', location: 'Tema, Ghana', when: 'Yesterday', current: false },
]

function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-canvas px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-ink-strong">
          {label}
        </label>
        {description ? <p className="mb-0 mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-0 transition ${
          checked ? 'bg-prospera' : 'bg-[#d7d7e0]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

function ChoiceGrid({ label, options, value, onChange, renderPreview }) {
  const groupId = useId()
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 text-sm font-semibold text-ink-strong">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby={groupId}>
        <span id={groupId} className="sr-only">
          {label}
        </span>
        {options.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-prospera bg-prospera-soft text-ink-strong shadow-[0_0_0_1px_var(--color-prospera)]'
                  : 'border-line bg-card text-ink-strong hover:border-ink-strong'
              }`}
            >
              {renderPreview ? renderPreview(option) : null}
              <strong className="mt-2 block text-sm text-ink-strong">{option.label}</strong>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Settings() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const { preferences, updatePreferences, updateNotifications, updateAccessibility, resetPreferences } =
    usePreferences()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || user?.businessType || '',
    businessType: user?.businessType || 'Entrepreneur',
    avatar: user?.avatar || '',
  })
  const [profileSaved, setProfileSaved] = useState(false)
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [sessions, setSessions] = useState(SESSION_SEED)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const fileRef = useRef(null)
  const initials = (profile.name || 'Y').trim().charAt(0).toUpperCase() || 'Y'

  const languageLabel = useMemo(
    () => LANGUAGES.find((item) => item.id === preferences.language)?.label || preferences.language,
    [preferences.language],
  )

  const saveProfile = (event) => {
    event.preventDefault()
    if (!profile.name.trim() || !profile.email.trim()) return
    updateUser({
      name: profile.name.trim(),
      email: profile.email.trim(),
      businessName: profile.businessName.trim(),
      businessType: profile.businessType.trim() || 'Entrepreneur',
      avatar: profile.avatar,
    })
    setProfileSaved(true)
    window.setTimeout(() => setProfileSaved(false), 2200)
  }

  const onAvatarPick = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setProfile((current) => ({ ...current, avatar: result }))
    }
    reader.readAsDataURL(file)
  }

  const changePassword = (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMsg('')
    if (password.current.length < 4) {
      setPasswordError('Enter your current password to continue.')
      return
    }
    if (password.next.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (password.next !== password.confirm) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setPassword({ current: '', next: '', confirm: '' })
    setPasswordMsg('Password updated for this demo session on this device. Live password resets will use your account email when auth is connected.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <PageShell wide>
      <PageHeader
        title="Account"
        accent="Settings"
        subtitle="Manage your Prospera profile, workspace look, alerts, and sign-in security."
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`settings-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`settings-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-prospera text-white'
                  : 'border border-line bg-card text-muted hover:text-ink'
              }`}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'profile' && (
        <section
          id="settings-panel-profile"
          role="tabpanel"
          aria-labelledby="settings-tab-profile"
          className="grid gap-5"
        >
          <AppCard>
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover shadow-[0_0_0_3px_var(--color-prospera-soft)]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-prospera to-prospera-dark text-2xl font-bold text-white shadow-[0_0_0_3px_var(--color-prospera-soft)]">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <h2 className="m-0 text-lg font-bold text-ink-strong">Profile photo</h2>
                <p className="mb-3 mt-1 text-sm text-muted">Shown in the sidebar and across your workspace.</p>
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={() => fileRef.current?.click()}>
                    Upload photo
                  </AppButton>
                  {profile.avatar ? (
                    <AppButton variant="ghost" onClick={() => setProfile((c) => ({ ...c, avatar: '' }))}>
                      Use initials
                    </AppButton>
                  ) : null}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onAvatarPick}
                />
              </div>
            </div>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
              <label className="grid gap-1.5 text-sm font-semibold">
                Full name
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  required
                  autoComplete="name"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Email
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Business name
                <input
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  placeholder="e.g. Yaa Beads Co."
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Business type
                <input
                  value={profile.businessType}
                  onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  placeholder="Entrepreneur"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <AppButton type="submit">Save profile</AppButton>
                {profileSaved ? (
                  <span className="text-sm font-semibold text-emerald-700" role="status">
                    Profile saved
                  </span>
                ) : null}
              </div>
            </form>
          </AppCard>

          <AppCard className="bg-prospera-soft/50">
            <h2 className="m-0 text-base font-bold text-ink-strong">Workspace locale</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Language and region shape how Prospera formats money, dates, and coaching copy.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Language
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreferences({ language: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Region & currency
                <select
                  value={preferences.region}
                  onChange={(e) => updatePreferences({ region: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                >
                  {REGIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mb-0 mt-3 text-xs text-muted">Active language: {languageLabel}</p>
          </AppCard>
        </section>
      )}

      {tab === 'appearance' && (
        <section
          id="settings-panel-appearance"
          role="tabpanel"
          aria-labelledby="settings-tab-appearance"
          className="grid gap-5"
        >
          <AppCard>
            <ChoiceGrid
              label="Theme"
              options={[
                { id: 'light', label: 'Light — bright market stall feel' },
                { id: 'dark', label: 'Dark — easier on evening eyes' },
              ]}
              value={preferences.theme}
              onChange={(theme) => updatePreferences({ theme })}
            />
          </AppCard>

          <AppCard>
            <ChoiceGrid
              label="Accent color"
              options={ACCENTS}
              value={preferences.accent}
              onChange={(accent) => updatePreferences({ accent })}
              renderPreview={(option) => (
                <span
                  className="block h-8 w-full rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${option.prospera}, ${option.dark})` }}
                />
              )}
            />
          </AppCard>

          <AppCard>
            <ChoiceGrid
              label="Workspace wallpaper"
              options={WALLPAPERS}
              value={preferences.wallpaper}
              onChange={(wallpaper) => updatePreferences({ wallpaper })}
              renderPreview={(option) => (
                <span
                  className="block h-16 w-full rounded-xl border border-line"
                  style={{
                    background:
                      preferences.theme === 'dark'
                        ? option.swatchDark || option.previewDark || option.preview
                        : option.swatch || option.preview,
                  }}
                />
              )}
            />
            <div className="mt-4">
              <AppButton variant="outline" onClick={resetPreferences}>
                Reset appearance defaults
              </AppButton>
            </div>
          </AppCard>
        </section>
      )}

      {tab === 'notifications' && (
        <section
          id="settings-panel-notifications"
          role="tabpanel"
          aria-labelledby="settings-tab-notifications"
          className="grid gap-3"
        >
          <AppCard className="grid gap-3">
            <h2 className="m-0 text-lg font-bold text-ink-strong">Stay on top of your business</h2>
            <p className="m-0 text-sm text-muted">
              Choose which Prospera moments ping you — grants, susu reminders, supplier fills, and Sena tips.
            </p>
            <Toggle
              id="notif-grants"
              label="Grant matches"
              description="When a new grant fits your business type"
              checked={preferences.notifications.grants}
              onChange={(grants) => updateNotifications({ grants })}
            />
            <Toggle
              id="notif-savings"
              label="Savings reminders"
              description="Weekly susu contribution due dates"
              checked={preferences.notifications.savings}
              onChange={(savings) => updateNotifications({ savings })}
            />
            <Toggle
              id="notif-suppliers"
              label="Supplier group buys"
              description="When a peer order is nearly full"
              checked={preferences.notifications.suppliers}
              onChange={(suppliers) => updateNotifications({ suppliers })}
            />
            <Toggle
              id="notif-sena"
              label="Sena coaching nudges"
              description="Short tips from your AI business coach"
              checked={preferences.notifications.sena}
              onChange={(sena) => updateNotifications({ sena })}
            />
            <Toggle
              id="notif-email"
              label="Weekly email digest"
              description="One summary instead of day-to-day pings"
              checked={preferences.notifications.emailDigest}
              onChange={(emailDigest) => updateNotifications({ emailDigest })}
            />
          </AppCard>
        </section>
      )}

      {tab === 'accessibility' && (
        <section
          id="settings-panel-accessibility"
          role="tabpanel"
          aria-labelledby="settings-tab-accessibility"
          className="grid gap-3"
        >
          <AppCard className="grid gap-3">
            <h2 className="m-0 text-lg font-bold text-ink-strong">Readability & comfort</h2>
            <p className="m-0 text-sm text-muted">
              Options tuned for market days, bright screens, and long planning sessions.
            </p>
            <Toggle
              id="a11y-large"
              label="Larger text"
              description="Increase base type size across Prospera"
              checked={preferences.accessibility.largeText}
              onChange={(largeText) => updateAccessibility({ largeText })}
            />
            <Toggle
              id="a11y-motion"
              label="Reduce motion"
              description="Tone down page animations and transitions"
              checked={preferences.accessibility.reduceMotion}
              onChange={(reduceMotion) => updateAccessibility({ reduceMotion })}
            />
            <Toggle
              id="a11y-contrast"
              label="Higher contrast"
              description="Stronger borders and text for outdoor glare"
              checked={preferences.accessibility.highContrast}
              onChange={(highContrast) => updateAccessibility({ highContrast })}
            />
          </AppCard>
        </section>
      )}

      {tab === 'security' && (
        <section
          id="settings-panel-security"
          role="tabpanel"
          aria-labelledby="settings-tab-security"
          className="grid gap-5"
        >
          <AppCard>
            <h2 className="m-0 text-lg font-bold text-ink-strong">Change password</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Keep a strong password you do not reuse on MoMo or banking apps.
            </p>
            <form className="grid max-w-md gap-3" onSubmit={changePassword}>
              <label className="grid gap-1.5 text-sm font-semibold">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password.next}
                  onChange={(e) => setPassword({ ...password, next: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  className="rounded-xl border border-line bg-card px-3 py-2.5 font-normal text-ink"
                  required
                />
              </label>
              {passwordError ? (
                <p className="m-0 text-sm font-semibold text-rose-700" role="alert">
                  {passwordError}
                </p>
              ) : null}
              {passwordMsg ? (
                <p className="m-0 text-sm font-semibold text-emerald-700" role="status">
                  {passwordMsg}
                </p>
              ) : null}
              <AppButton type="submit" variant="dark">
                Update password
              </AppButton>
            </form>
          </AppCard>

          <AppCard>
            <h2 className="m-0 text-lg font-bold text-ink-strong">Session activity</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Illustrative devices for this demo. Live session revoke will appear when server auth is connected.
            </p>
            <ul className="m-0 grid list-none gap-3 p-0">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas px-4 py-3"
                >
                  <div>
                    <strong className="block text-sm text-ink-strong">{session.device}</strong>
                    <span className="text-sm text-muted">
                      {session.location} · {session.when}
                    </span>
                  </div>
                  {session.current ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      This device
                    </span>
                  ) : (
                    <AppButton
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setSessions((current) => current.filter((row) => row.id !== session.id))}
                    >
                      Sign out
                    </AppButton>
                  )}
                </li>
              ))}
            </ul>
          </AppCard>

          <AppCard className="border-rose-100">
            <h2 className="m-0 text-lg font-bold text-ink-strong">Log out</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Clears your local session token and returns you to the login screen. Unsaved drafts on this device
              stay in the browser until you clear site data.
            </p>
            {!logoutConfirm ? (
              <AppButton variant="danger" onClick={() => setLogoutConfirm(true)}>
                <Icon name="logout" size={16} />
                Log out of Prospera
              </AppButton>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AppButton variant="danger" onClick={handleLogout}>
                  Confirm log out
                </AppButton>
                <AppButton variant="outline" onClick={() => setLogoutConfirm(false)}>
                  Cancel
                </AppButton>
              </div>
            )}
          </AppCard>
        </section>
      )}
    </PageShell>
  )
}

export default Settings
