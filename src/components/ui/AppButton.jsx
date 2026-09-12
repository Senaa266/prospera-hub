const VARIANTS = {
  primary:
    'bg-gradient-to-br from-prospera to-prospera-dark text-white shadow-[0_8px_20px_rgb(241_1_120_/_0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgb(241_1_120_/_0.32)]',
  dark: 'bg-[#111114] text-white hover:bg-black hover:-translate-y-0.5',
  outline:
    'border border-line bg-card text-ink hover:border-ink-strong hover:bg-canvas',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
  danger: 'border border-red-600 bg-red-600 text-white hover:bg-red-700',
  indigo:
    'bg-gradient-to-br from-brand-indigo to-brand-violet text-white hover:-translate-y-0.5',
}

/**
 * Shared button / link styling for Prospera actions.
 */
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
