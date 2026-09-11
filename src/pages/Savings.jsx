import Navbar from '../components/layout/Navbar'
import './Feature.css'

function Savings() {
  const myGroups = []
  const availableGroups = [
    {
      name: 'Ayah Susu Circle',
      amount: 'GH₵ 200 / week',
      members: 12,
      filled: 8,
      nextPayout: 'Monday',
    },
    {
      name: 'Trader Women Group',
      amount: 'GH₵ 100 / week',
      members: 20,
      filled: 14,
      nextPayout: 'Thursday',
    },
  ]

  return (
    <div className="feature-page">
      <Navbar />
      <main className="feature-main">
        <div className="feature-header">
          <h1>Susu Savings</h1>
          <p>Transparent group savings. Everyone can see who paid, who hasn't, and exactly what each person gets.</p>
        </div>

        <div className="savings-actions">
          <button className="btn-primary-dark" type="button">Start a new circle</button>
          <button className="btn-outline-dark" type="button">Join existing circle</button>
        </div>

        {myGroups.length === 0 && (
          <div className="empty-state">
            <p>You are not in any savings circle yet.</p>
            <p className="empty-sub">Join a group or start your own to begin saving together.</p>
          </div>
        )}

        <h2 className="section-title">Available circles</h2>
        <div className="groups-list">
          {availableGroups.map((g, i) => (
            <div className="group-card" key={i}>
              <div className="group-info">
                <h3>{g.name}</h3>
                <p className="group-amount">{g.amount}</p>
                <p className="group-meta">
                  {g.filled}/{g.members} spots filled · Next payout: {g.nextPayout}
                </p>
              </div>
              <div className="group-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${(g.filled / g.members) * 100}%` }}
                />
              </div>
              <button className="btn-join" type="button">Join circle</button>
            </div>
          ))}
        </div>

        <div className="info-box">
          <h4>How transparent savings work</h4>
          <p>Every member sees real-time payment status. If someone stops paying, the group is notified and the system calculates fair adjustments automatically.</p>
        </div>
      </main>
    </div>
  )
}

export default Savings