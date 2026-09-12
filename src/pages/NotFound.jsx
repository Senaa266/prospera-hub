import { Link } from 'react-router-dom'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { useAuth } from '../context/AuthContext'

function NotFound() {
  const { token } = useAuth()
  const home = token ? '/dashboard' : '/'

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <AppCard className="max-w-md text-center">
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-prospera">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-strong">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          That link does not match a Prospera screen. Head back to a safe place and keep building.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <AppButton as={Link} to={home}>
            {token ? 'Dashboard' : 'Home'}
          </AppButton>
          {!token ? (
            <AppButton as={Link} to="/login" variant="outline">
              Sign in
            </AppButton>
          ) : null}
        </div>
      </AppCard>
    </div>
  )
}

export default NotFound
