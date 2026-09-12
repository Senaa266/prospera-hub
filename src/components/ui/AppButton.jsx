const VARIANTS = {
  primary:
    'bg-gradient-to-br from-prospera to-prospera-dark text-white shadow-[0_8px_20px_rgb(241_1_120_/_0.25)] hover:-translate-y-0.5',
  dark: 'bg-ink-strong text-white hover:bg-black hover:-translate-y-0.5',
  outline: 'border border-line bg-white text-ink hover:border-ink-strong hover:bg-canvas',
  ghost: 'bg-transparent text-muted hover:bg-white hover:text-ink',
}

export function AppButton({
  as: Tag = 'button',
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const extra = Tag === 'button' ? { type } : {}
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold no-underline transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...extra}
      {...props}
    >
      {children}
    </Tag>
  )
}

export default AppButton
