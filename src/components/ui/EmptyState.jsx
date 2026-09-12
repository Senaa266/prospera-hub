import { Link } from 'react-router-dom'
import Icon from '../icons'
import { AppButton } from './AppButton'
import { AppCard } from './AppCard'

/**
 * Shared empty / offline / soft-error panel for lists and tables.
 */
export function EmptyState({
  icon = 'sparkles',
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  tone = 'default',
}) {
  const toneClass =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50/60'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50/60'
        : 'border-line bg-card'

  return (
    <AppCard className={`text-center ${toneClass}`}>
      <span className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-prospera-soft text-prospera">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="m-0 text-base font-bold text-ink-strong">{title}</h3>
      {description ? <p className="mb-0 mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      {actionLabel && (onAction || actionTo) ? (
        <div className="mt-4">
          {actionTo ? (
            <AppButton as={Link} to={actionTo}>
              {actionLabel}
            </AppButton>
          ) : (
            <AppButton onClick={onAction} variant={tone === 'error' ? 'dark' : 'primary'}>
              {actionLabel}
            </AppButton>
          )}
        </div>
      ) : null}
    </AppCard>
  )
}

export default EmptyState
