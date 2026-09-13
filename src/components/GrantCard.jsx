import { useState } from 'react'
import Icon from './icons'
import { imageFor, faviconGoogle } from '../utils/grants'
import { industryImageFor } from '../data/industries'
import './GrantCard.css'

const readSaved = (id) => {
  try {
    return (JSON.parse(localStorage.getItem('savedGrants')) || []).includes(id)
  } catch {
    return false
  }
}

const writeSaved = (id, saved) => {
  try {
    const list = (JSON.parse(localStorage.getItem('savedGrants')) || []).filter((x) => x !== id)
    if (saved) list.unshift(id)
    localStorage.setItem('savedGrants', JSON.stringify(list))
  } catch {
    /* ignore storage errors */
  }
}

function GrantCard({ grant, saved, onToggleSaved, onAskAi }) {
  const id = grant.id ?? grant.title
  const controlled = saved !== undefined && typeof onToggleSaved === 'function'
  const [localSaved, setLocalSaved] = useState(() => readSaved(id))
  const [src, setSrc] = useState(imageFor(grant))
  const [triedFallback, setTriedFallback] = useState(false)
  const [broken, setBroken] = useState(false)

  const isSaved = controlled ? saved : localSaved

  const toggleSaved = () => {
    if (controlled) {
      onToggleSaved(id)
      return
    }
    const next = !localSaved
    setLocalSaved(next)
    writeSaved(id, next)
  }

  const onImageError = () => {
    if (!triedFallback) {
      const fb = faviconGoogle(grant.externalUrl)
      if (fb) {
        setTriedFallback(true)
        setSrc(fb)
        return
      }
    }
    setBroken(true)
  }

  return (
    <article
      className="grant-card"
      style={{ backgroundImage: `url("${industryImageFor(grant.type)}")` }}
    >
      <div className="grant-top">
        <div className="grant-logo">
          {src && !broken ? (
            <img
              src={src}
              alt={`${grant.title} logo`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={onImageError}
            />
          ) : (
            <div className="grant-logo-ph">
              <Icon name="target" size={22} />
            </div>
          )}
        </div>
        <div className="grant-top-right">
          <button
            className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
            type="button"
            onClick={toggleSaved}
            aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
          >
            <Icon name="bookmark" size={15} />
          </button>
          {grant.type && <span className="grant-type-pill">{grant.type}</span>}
        </div>
      </div>

      <h3 className="grant-title">{grant.title}</h3>
      <p className="grant-desc">{grant.description}</p>

      <div className="grant-foot">
        {typeof onAskAi === 'function' && (
          <button
            className="btn-ask-ai"
            type="button"
            onClick={() => onAskAi(grant)}
            aria-label={`Ask Sena about ${grant.title}`}
          >
            <Icon name="sparkles" size={14} />
            Ask AI
          </button>
        )}
        <a
          className="btn-explore"
          href={grant.externalUrl || '#'}
          target="_blank"
          rel="noreferrer"
        >
          Explore
          <Icon name="arrowRight" size={15} />
        </a>
      </div>
    </article>
  )
}

export default GrantCard