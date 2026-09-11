const circles = [
  {
    id: 1,
    name: 'Ayah Susu Circle',
    amount: 200,
    period: 'weekly',
    members: 12,
    filled: 8,
  },
  {
    id: 2,
    name: 'Trader Women Group',
    amount: 100,
    period: 'weekly',
    members: 20,
    filled: 14,
  },
]

export function listCircles(req, res) {
  res.json({ circles })
}

export function createCircle(req, res) {
  const { name, amount, period, members } = req.body

  if (!name || !amount) {
    return res.status(400).json({ message: 'Circle name and amount are required' })
  }

  const circle = {
    id: circles.length + 1,
    name,
    amount,
    period: period || 'weekly',
    members: members || 10,
    filled: 0,
  }
  circles.push(circle)
  res.status(201).json({ circle })
}

export function joinCircle(req, res) {
  const { circleId } = req.body
  const circle = circles.find((c) => c.id === Number(circleId))

  if (!circle) {
    return res.status(404).json({ message: 'Circle not found' })
  }
  if (circle.filled >= circle.members) {
    return res.status(400).json({ message: 'Circle is full' })
  }

  circle.filled += 1
  res.json({ circle })
}