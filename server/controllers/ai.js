export async function chat(req, res) {
  const { message } = req.body

  if (!message) {
    return res.status(400).json({ message: 'Message is required' })
  }

  const text = message.toLowerCase()
  let reply

  if (text.includes('grant') || text.includes('fund')) {
    reply =
      'You can find current grants in the Grants page. Check your eligibility before applying. Would you like me to help you prepare an application?'
  } else if (text.includes('susu') || text.includes('saving')) {
    reply =
      'Our Susu savings feature lets you join a transparent group circle. Every member sees who has paid, and payouts are calculated clearly. Would you like me to suggest a savings plan for your goal?'
  } else if (text.includes('supplier') || text.includes('bulk') || text.includes('wholesale')) {
    reply =
      'The Peer Supplier feature teams you up with similar businesses to unlock bulk discounts. Post a product you need and we will match you with others ordering the same product.'
  } else if (text.includes('idea') || text.includes('start') || text.includes('business')) {
    reply =
      'Great! Let me help you turn that idea into a plan. Tell me more about your business goal - the product, your market, and how much you want to invest - and I will build you a step-by-step checklist.'
  } else if (text.includes('finance') || text.includes('profit') || text.includes('expense')) {
    reply =
      'Log your income and expenses in the Finance page, and I can generate reports, point out spending patterns, and suggest improvements for your business.'
  } else {
    reply =
      'I can help with business planning, grants, savings, suppliers, and financial advice. What would you like to focus on today?'
  }

  res.json({ reply })
}