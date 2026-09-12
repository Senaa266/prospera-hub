import { useId, useRef, useState } from 'react'
import Icon from '../icons'
import { AppButton } from '../ui/AppButton'

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_LABEL = 'PDF, JPG, PNG, or WEBP'
const MAX_BYTES = 5 * 1024 * 1024

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Drag-and-drop / file-picker upload zone with validation and simulated progress.
 */
export function DocumentUploadZone({
  label,
  hint,
  required = false,
  fileMeta,
  onUploaded,
  onClear,
}) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(fileMeta ? 100 : 0)
  const [busy, setBusy] = useState(false)

  const ingest = (file) => {
    if (!file) return
    setError('')

    if (!ACCEPTED.includes(file.type)) {
      setError(`Use ${ACCEPTED_LABEL}.`)
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File must be 5 MB or smaller.')
      return
    }

    setBusy(true)
    setProgress(8)
    let current = 8
    const timer = window.setInterval(() => {
      current = Math.min(92, current + 14 + Math.random() * 10)
      setProgress(Math.round(current))
      if (current >= 92) {
        window.clearInterval(timer)
        window.setTimeout(() => {
          setProgress(100)
          setBusy(false)
          onUploaded?.({
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          })
        }, 220)
      }
    }, 120)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    ingest(event.dataTransfer.files?.[0])
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="m-0 text-sm font-bold text-ink-strong">
            {label}
            {required ? <span className="text-prospera"> *</span> : null}
          </p>
          {hint ? <p className="mb-0 mt-1 text-xs leading-5 text-muted">{hint}</p> : null}
        </div>
        {fileMeta && !busy ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <Icon name="check" size={12} />
            Verified locally
          </span>
        ) : null}
      </div>

      {fileMeta && !busy ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <Icon name="file" size={18} />
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-ink-strong">{fileMeta.name}</p>
              <p className="mb-0 mt-0.5 text-xs text-muted">{formatBytes(fileMeta.size)}</p>
            </div>
          </div>
          <AppButton
            variant="outline"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => {
              setProgress(0)
              onClear?.()
            }}
          >
            Replace
          </AppButton>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label}. Drop a file here or press Enter to browse.`}
          aria-describedby={`${inputId}-hint`}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition duration-300 ${
            dragging
              ? 'border-prospera bg-prospera-soft/70'
              : 'border-line bg-canvas hover:border-prospera/50 hover:bg-prospera-soft/30'
          }`}
        >
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-prospera-soft text-prospera">
            <Icon name="upload" size={20} />
          </span>
          <p className="m-0 text-sm font-semibold text-ink-strong">
            {busy ? 'Uploading…' : 'Drop a file here or click to browse'}
          </p>
          <p id={`${inputId}-hint`} className="mb-0 mt-1 text-xs text-muted">
            {ACCEPTED_LABEL} · up to 5 MB
          </p>
          {busy ? (
            <div className="mt-4 w-full max-w-xs">
              <div
                className="h-2 overflow-hidden rounded-full bg-[#ececf2]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={`Upload progress for ${label}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-prospera to-brand-indigo transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mb-0 mt-1.5 text-xs font-semibold text-muted">{progress}%</p>
            </div>
          ) : null}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          ingest(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      {error ? (
        <p className="mb-0 mt-2 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default DocumentUploadZone
