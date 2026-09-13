import GrantCard from './GrantCard'
import './GrantCarousel.css'

/**
 * A horizontal, auto-scrolling strip of grant cards.
 * Cards scroll continuously one after another and pause while hovered.
 * The second half of the track is a duplicate so the loop is seamless.
 */
function GrantCarousel({ grants }) {
  const duration = `${Math.max(35, grants.length * 8)}s`

  return (
    <div className="grant-carousel" aria-label="Grant opportunities, auto-scrolling">
      <div className="grant-carousel-track" style={{ animationDuration: duration }}>
        <div className="grant-carousel-set">
          {grants.map((g) => (
            <div className="grant-carousel-item" key={`a-${g.id ?? g.title}`}>
              <GrantCard grant={g} />
            </div>
          ))}
        </div>
        <div className="grant-carousel-set" aria-hidden="true">
          {grants.map((g) => (
            <div className="grant-carousel-item" key={`b-${g.id ?? g.title}`}>
              <GrantCard grant={g} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GrantCarousel