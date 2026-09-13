import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/icons'
import { AppButton } from '../components/ui/AppButton'
import { PageShell } from '../components/ui/PageShell'
import { savings } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Feature.css'

function SavingsInvite() {
  const { token } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!auth.token) {
      navigate('/login', { state: { from: `/invite/${token}` }, replace: true })
      return
    }
    ;(async () => {
      try {
        const result = await savings.joinByInvite(token, auth.token)
        setStatus(result?.circle?.name ? 'joined' : 'done')
      } catch {
        setStatus('error')
      }
    })()
  }, [token, auth.token, navigate])

  return (
    <PageShell>
      <div className="mx-auto max-w-md pt-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-ink-strong text-white">
          <Icon name="usersPlus" size={28} />
        </div>

        {status === 'loading' && <p className="m-0 text-sm text-muted">Joining the circle…</p>}

        {status === 'joined' && (
          <div className="grid gap-4">
            <h1 className="m-0 text-2xl font-bold tracking-tight text-ink-strong">
              You're in the circle
            </h1>
            <p className="m-0 text-sm leading-6 text-muted">
              You accepted the invite and are now a member. Take a look at the rotation, who has
              paid, and when your payout lands.
            </p>
            <AppButton onClick={() => navigate('/savings')}>View your savings</AppButton>
          </div>
        )}

        {status === 'error' && (
          <div className="grid gap-4">
            <h1 className="m-0 text-2xl font-bold tracking-tight text-ink-strong">
              This invite can't be used
            </h1>
            <p className="m-0 text-sm leading-6 text-muted">
              The invite may have expired or already been accepted. Ask the circle owner to send a
              fresh one.
            </p>
            <AppButton variant="outline" onClick={() => navigate('/savings')}>
              Back to savings
            </AppButton>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <Icon name="shield" size={13} />
          Invites only work for people logged into Prospera
        </div>
      </div>
    </PageShell>
  )
}

export default SavingsInvite