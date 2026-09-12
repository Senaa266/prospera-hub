import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/icons'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

const FEATURES = [
  {
    icon: 'target',
    title: 'Grants discovery',
    desc: 'Surface funding matched to your business type — you decide what to pursue.',
    to: '/grants',
    cta: 'Explore grants',
  },
  {
    icon: 'sparkles',
    title: 'Sena, your AI coach',
    desc: 'Ask by text or voice. Get pricing help, plans, and next steps in plain language.',
    to: '/ai-chat',
    cta: 'Chat with Sena',
  },
  {
    icon: 'wallet',
    title: 'Transparent susu',
    desc: 'Group savings with visible payments — who paid, who’s due, and what you receive.',
    to: '/savings',
    cta: 'View savings',
  },
  {
    icon: 'users',
    title: 'Peer supplier buys',
    desc: 'Pool orders with similar businesses and unlock wholesale group prices.',
    to: '/suppliers',
    cta: 'Browse suppliers',
  },
  {
    icon: 'chart',
    title: 'Financial tracking',
    desc: 'Log sales and expenses, then ask Sena for a clear cash snapshot.',
    to: '/finance',
    cta: 'Open finance',
  },
  {
    icon: 'trend',
    title: 'Growth pathways',
    desc: 'Move from savings and grants toward partnerships that scale your stock.',
    to: '/dashboard',
    cta: 'Go to dashboard',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Create your profile',
    text: 'Share what you sell and where you want to grow.',
  },
  {
    n: '02',
    title: 'Fund and save',
    text: 'Find grants, join a susu circle, and track every cedi.',
  },
  {
    n: '03',
    title: 'Buy and scale',
    text: 'Join peer supplier orders and keep cash flowing with Sena.',
  },
]

const PARTNERS = ['Absa', 'Fidelity', 'GCB', 'MTN MoMo', 'Telecel', 'Impact Hub']

const VALUE_STATS = [
  { label: 'Grant matches surfaced', value: '120+', hint: 'Across Ghana & beyond' },
  { label: 'Avg. group-buy savings', value: '28%', hint: 'Vs solo wholesale' },
  { label: 'Susu circles supported', value: '45+', hint: 'Transparent weekly pays' },
  { label: 'Sena coaching replies', value: '24/7', hint: 'Plain-language next steps' },
]

const STORIES = [
  {
    quote:
      'I found a grant I had never heard of, then used susu to cover the matching contribution. Prospera made both steps feel doable.',
    name: 'Ama Serwaa',
    role: 'Beads & accessories · Accra',
  },
  {
    quote:
      'Our group buy cut packaging costs by a third. Seeing the order fill in real time kept everyone honest.',
    name: 'Efua Mensah',
    role: 'Packaging reseller · Tema',
  },
  {
    quote:
      'Sena helped me price a new Ankara line without overthinking. I still make the decisions — she just keeps me moving.',
    name: 'Adjoa Boateng',
    role: 'Fashion trader · Kumasi',
  },
]

function scrollToId(id) {
  const node = document.getElementById(id)
  if (!node) return
  node.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Landing() {
  const { token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuButtonRef = useRef(null)
  const menuPanelRef = useRef(null)
  const startTo = token ? '/dashboard' : '/login'

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuPanelRef.current?.querySelector('a, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  const goSection = (id) => {
    setMenuOpen(false)
    window.setTimeout(() => scrollToId(id), 50)
  }

  return (
    <div className="landing min-h-screen bg-canvas text-ink">
      <a href="#main" className="landing-skip">
        Skip to content
      </a>

      <header className="landing-nav sticky top-0 z-[100] border-b border-white/10 bg-[#0e0e11]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link to="/" className="landing-brand inline-flex items-center gap-2.5 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-prospera to-prospera-dark text-lg font-extrabold text-white shadow-[0_8px_20px_rgb(241_1_120_/_0.35)]">
              P
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Prospera<span className="text-prospera">Hub</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <button type="button" className="landing-link" onClick={() => scrollToId('features')}>
              Features
            </button>
            <button type="button" className="landing-link" onClick={() => scrollToId('how')}>
              How it works
            </button>
            <button type="button" className="landing-link" onClick={() => scrollToId('stories')}>
              Stories
            </button>
            <Link to="/login" className="landing-link-muted no-underline">
              Sign in
            </Link>
            <Link to={startTo} className="landing-cta no-underline">
              Get started
            </Link>
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <Icon name="x" size={20} />
            ) : (
              <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
                <span className="h-0.5 w-full rounded-full bg-white" />
                <span className="h-0.5 w-full rounded-full bg-white" />
                <span className="h-0.5 w-full rounded-full bg-white" />
              </span>
            )}
          </button>
        </div>

        {menuOpen ? (
          <div
            id={menuId}
            ref={menuPanelRef}
            className="border-t border-white/10 bg-[#0e0e11] px-5 py-4 md:hidden"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-1">
              <button type="button" className="landing-mobile-link" onClick={() => goSection('features')}>
                Features
              </button>
              <button type="button" className="landing-mobile-link" onClick={() => goSection('how')}>
                How it works
              </button>
              <button type="button" className="landing-mobile-link" onClick={() => goSection('stories')}>
                Stories
              </button>
              <Link to="/login" className="landing-mobile-link no-underline" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link
                to={startTo}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-prospera px-4 py-3 text-sm font-semibold text-white no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main">
        <section className="landing-hero relative flex min-h-[calc(100svh-72px)] items-end overflow-hidden md:min-h-[calc(100svh-76px)] md:items-center">
          <div
            className="landing-hero-photo absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1741085766062-b1a596c6fb91?w=1800&q=80&auto=format&fit=crop')",
            }}
            role="img"
            aria-label="Entrepreneurs collaborating in a bright business space"
          />
          <div className="landing-hero-veil absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-24">
            <p className="landing-fade landing-brand-mark m-0">
              Prospera<span>Hub</span>
            </p>
            <h1 className="landing-fade landing-fade-delay-1 landing-hero-title m-0 max-w-[15ch]">
              Small businesses.
              <span> Bigger opportunities.</span>
            </h1>
            <p className="landing-fade landing-fade-delay-2 landing-hero-copy mb-9 mt-6 max-w-[34rem]">
              Find grants. Save with transparent susu. Buy stock together. Grow with Sena, your AI business coach.
            </p>
            <div className="landing-fade landing-fade-delay-3 flex flex-wrap items-center gap-3">
              <Link to={startTo} className="landing-hero-primary no-underline">
                Start your business
                <Icon name="arrowRight" size={17} />
              </Link>
              <button type="button" className="landing-hero-secondary" onClick={() => scrollToId('features')}>
                Explore Prospera
              </button>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-white" aria-label="Partners and trust">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="m-0 text-sm font-semibold text-muted">Trusted payment rails & partner networks</p>
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-2 p-0">
              {PARTNERS.map((name) => (
                <li key={name} className="landing-partner-chip text-sm font-bold tracking-wide text-ink/55">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="overflow-x-clip border-b border-line bg-canvas px-5 py-14 md:px-8" aria-label="Value propositions">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <h2 className="m-0 text-2xl font-bold tracking-tight text-ink-strong md:text-3xl">
                Built for the next sale — not another dashboard
              </h2>
              <p className="mb-0 mt-3 text-sm leading-6 text-muted md:text-base md:leading-7">
                Funding clarity, trustworthy savings, peer wholesale power, and a coach that keeps you moving.
              </p>
            </div>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {VALUE_STATS.map((stat) => (
                <li key={stat.label} className="landing-stat">
                  <p className="m-0 text-2xl font-extrabold tracking-tight text-prospera md:text-3xl">{stat.value}</p>
                  <p className="mb-0 mt-2 text-sm font-bold text-ink-strong">{stat.label}</p>
                  <p className="mb-0 mt-1 text-xs text-muted">{stat.hint}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 overflow-x-clip px-5 py-20 md:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="m-0 text-3xl font-bold tracking-tight text-ink-strong md:text-4xl">
                Everything your business needs
              </h2>
              <p className="mb-0 mt-3 text-base leading-7 text-muted">
                One workspace for funding, savings, coaching, and bulk buying — built for women who sell every day.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="landing-lift landing-lift-feature group rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)]"
                >
                  <div className="landing-lift-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-prospera-soft text-prospera">
                    <Icon name={feature.icon} size={20} />
                  </div>
                  <h3 className="m-0 text-lg font-bold text-ink-strong">{feature.title}</h3>
                  <p className="mb-5 mt-2 text-sm leading-6 text-muted">{feature.desc}</p>
                  <Link
                    to={token ? feature.to : '/login'}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-prospera no-underline transition-all duration-300 group-hover:gap-2.5"
                  >
                    {feature.cta}
                    <Icon name="arrowRight" size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 overflow-x-clip border-y border-line bg-prospera-soft/40 px-5 py-20 md:px-8">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="m-0 text-3xl font-bold tracking-tight text-ink-strong md:text-4xl">How it works</h2>
              <p className="mb-0 mt-3 text-base leading-7 text-muted">
                Three steps from first login to a clearer week of sales, savings, and stock.
              </p>
            </div>
            <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="landing-lift landing-lift-step rounded-2xl bg-white/80 p-6 text-center shadow-[var(--shadow-card)]"
                >
                  <span className="landing-lift-icon inline-flex h-12 w-12 items-center justify-center rounded-full bg-prospera text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <h3 className="mb-2 mt-4 text-lg font-bold text-ink-strong">{step.title}</h3>
                  <p className="m-0 text-sm leading-6 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="stories" className="scroll-mt-24 overflow-x-clip px-5 py-20 md:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="m-0 text-3xl font-bold tracking-tight text-ink-strong md:text-4xl">
                Voices from the market
              </h2>
              <p className="mb-0 mt-3 text-base leading-7 text-muted">
                Simulated stories inspired by traders who need tools that respect their time and cash flow.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {STORIES.map((story) => (
                <figure
                  key={story.name}
                  className="landing-lift landing-lift-story m-0 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)]"
                >
                  <blockquote className="m-0 text-base leading-7 text-ink">“{story.quote}”</blockquote>
                  <figcaption className="mt-5 border-t border-line pt-4 transition-colors duration-300">
                    <p className="m-0 font-bold text-ink-strong">{story.name}</p>
                    <p className="mb-0 mt-1 text-sm text-muted">{story.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-x-clip px-5 pb-20 md:px-8">
          <div className="landing-final mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[28px] px-8 py-12 text-white md:flex-row md:items-center md:px-12">
            <div className="max-w-xl">
              <h2 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">Ready when your next sale is.</h2>
              <p className="mb-0 mt-3 text-base leading-7 text-white/80">
                Open Prospera in minutes. Bring your business goals — we’ll help you fund, save, and stock with
                confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={startTo} className="landing-hero-primary no-underline">
                Create account
                <Icon name="arrowRight" size={17} />
              </Link>
              <Link to="/login" className="landing-hero-secondary no-underline">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-prospera to-prospera-dark text-lg font-extrabold text-white">
                P
              </span>
              <span className="text-lg font-bold text-ink-strong">
                Prospera<span className="text-prospera">Hub</span>
              </span>
            </div>
            <p className="m-0 max-w-sm text-sm leading-6 text-muted">
              Built for African female entrepreneurs who need funding clarity, trustworthy savings, and peer power
              at the wholesale counter.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Product</p>
            <ul className="m-0 grid list-none gap-2 p-0 text-sm">
              <li>
                <button type="button" className="landing-footer-link" onClick={() => scrollToId('features')}>
                  Features
                </button>
              </li>
              <li>
                <button type="button" className="landing-footer-link" onClick={() => scrollToId('how')}>
                  How it works
                </button>
              </li>
              <li>
                <Link to={startTo} className="landing-footer-link no-underline">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Account</p>
            <ul className="m-0 grid list-none gap-2 p-0 text-sm">
              <li>
                <Link to="/login" className="landing-footer-link no-underline">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/login" className="landing-footer-link no-underline">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mb-0 mt-10 max-w-[1200px] text-sm text-muted">
          © {new Date().getFullYear()} Prospera Hub. Built for African entrepreneurs.
        </p>
      </footer>
    </div>
  )
}

export default Landing
