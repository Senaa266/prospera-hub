/**
 * Consistent page title block used across product surfaces.
 */
export function PageHeader({ title, accent, subtitle, actions }) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 className="m-0 mb-1.5 text-[1.9rem] font-bold tracking-tight text-ink-strong">
          {title}
          {accent ? (
            <>
              {' '}
              <span className="text-gradient">{accent}</span>
            </>
          ) : null}
        </h1>
        {subtitle ? <p className="m-0 text-[0.95rem] leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
