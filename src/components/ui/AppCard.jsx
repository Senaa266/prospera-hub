export function AppCard({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

export default AppCard
