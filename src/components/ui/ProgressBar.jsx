/**
 * Accessible progress track used on Dashboard trackers and savings cards.
 */
export function ProgressBar({ value = 0, label, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`w-full ${className}`}>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#ececf2]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-prospera to-brand-indigo transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
