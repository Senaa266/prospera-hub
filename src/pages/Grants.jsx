import Navbar from '../components/layout/Navbar'
import './Feature.css'

function Grants() {
  const grants = [
    {
      title: 'Ghana Startup Grant',
      amount: 'GH₵ 5,000 – GH₵ 25,000',
      deadline: '30 September 2026',
      type: 'Tech / Innovation',
      desc: 'Available to registered Ghanaian startups under 3 years old building tech solutions.',
    },
    {
      title: 'AfDB Youth Entrepreneurship',
      amount: 'GH₵ 10,000 – GH₵ 100,000',
      deadline: '15 November 2026',
      type: 'All sectors',
      desc: 'Open to 18–35 year-old entrepreneurs across Africa with a viable business plan.',
    },
    {
      title: 'Google for Startups Africa',
      amount: '$10,000 – $50,000',
      deadline: 'Rolling',
      type: 'Tech / Digital',
      desc: 'For digital-first startups solving local problems in Africa.',
    },
  ]

  return (
    <div className="feature-page">
      <Navbar />
      <main className="feature-main">
        <div className="feature-header">
          <h1>Grants & Funding</h1>
          <p>Find grants that fit your business. Check if you qualify and decide for yourself if you want to apply.</p>
        </div>

        <div className="grants-list">
          {grants.map((g, i) => (
            <div className="grant-card" key={i}>
              <div className="grant-top">
                <span className="grant-type">{g.type}</span>
                <span className="grant-deadline">⏰ {g.deadline}</span>
              </div>
              <h3>{g.title}</h3>
              <p className="grant-amount">{g.amount}</p>
              <p className="grant-desc">{g.desc}</p>
              <div className="grant-actions">
                <button className="btn-check" type="button">Check eligibility</button>
                <button className="btn-apply" type="button">View details</button>
              </div>
            </div>
          ))}
        </div>

        <div className="info-box">
          <h4>Looking for more grants?</h4>
          <p>Our AI coach can help you discover additional funding sources and prepare your applications.</p>
          <a href="/ai-chat" className="btn-ai-link">Chat with AI Coach →</a>
        </div>
      </main>
    </div>
  )
}

export default Grants