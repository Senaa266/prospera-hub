export function listGrants(req, res) {
  const grants = [
    {
      id: 1,
      title: 'Ghana Startup Grant',
      amount: 'GHS 5,000 - GHS 25,000',
      deadline: '2026-09-30',
      type: 'Tech / Innovation',
    },
    {
      id: 2,
      title: 'AfDB Youth Entrepreneurship',
      amount: 'GHS 10,000 - GHS 100,000',
      deadline: '2026-11-15',
      type: 'All sectors',
    },
    {
      id: 3,
      title: 'Google for Startups Africa',
      amount: '$10,000 - $50,000',
      deadline: '2026-12-31',
      type: 'Tech / Digital',
    },
  ]

  res.json({ grants })
}