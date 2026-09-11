import Navbar from '../components/layout/Navbar'
import './Feature.css'

function Suppliers() {
  const supplierGroups = [
    {
      product: 'Beads & beads accessories',
      supplier: 'Kantamanto Wholesale',
      soloPrice: 'GH₵ 35 / bag',
      groupPrice: 'GH₵ 24 / bag',
      minOrders: 5,
      currentOrders: 3,
      discount: '31%',
    },
    {
      product: 'Fabric (Ankara / Kente)',
      supplier: 'Opera Market Suppliers',
      soloPrice: 'GH₵ 65 / yard',
      groupPrice: 'GH₵ 48 / yard',
      minOrders: 8,
      currentOrders: 5,
      discount: '26%',
    },
    {
      product: 'Packaging materials',
      supplier: 'ChinaAgent-GH',
      soloPrice: 'GH₵ 12 / unit',
      groupPrice: 'GH₵ 8 / unit',
      minOrders: 20,
      currentOrders: 14,
      discount: '33%',
    },
  ]

  return (
    <div className="feature-page">
      <Navbar />
      <main className="feature-main">
        <div className="feature-header">
          <h1>Peer Supplier</h1>
          <p>Need a product but can't afford bulk? Team up with similar businesses and unlock supplier discounts together.</p>
        </div>

        <div className="savings-actions">
          <button className="btn-primary-dark" type="button">List a product need</button>
          <button className="btn-outline-dark" type="button">Find group orders</button>
        </div>

        <h2 className="section-title">Active group orders</h2>
        <div className="suppliers-grid">
          {supplierGroups.map((s, i) => (
            <div className="supplier-card" key={i}>
              <div className="supplier-badge" style={{ background: '#0a7d4f' }}>
                Save {s.discount}
              </div>
              <h3>{s.product}</h3>
              <p className="supplier-name">Supplier: {s.supplier}</p>
              <div className="price-comparison">
                <div className="price-old">
                  <span>Solo price</span>
                  <strong>{s.soloPrice}</strong>
                </div>
                <div className="price-new">
                  <span>Group price</span>
                  <strong>{s.groupPrice}</strong>
                </div>
              </div>
              <div className="order-progress">
                <span>{s.currentOrders}/{s.minOrders} orders needed</span>
                <div className="progress-bar">
                  <div
                    style={{ width: `${(s.currentOrders / s.minOrders) * 100}%` }}
                  />
                </div>
              </div>
              <button className="btn-join" type="button">Join this order</button>
            </div>
          ))}
        </div>

        <div className="info-box china-box">
          <h4>China supplier access</h4>
          <p>Looking for products from China? We're building a network of China agents who can help you source and ship products at group-discounted rates.</p>
        </div>
      </main>
    </div>
  )
}

export default Suppliers