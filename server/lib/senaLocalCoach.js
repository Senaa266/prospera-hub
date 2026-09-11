const COUNTRIES = [
  ['ghana', 'Ghana', 'GH₵', 'MoMo', 'GRA registration and a district assembly permit'],
  ['nigeria', 'Nigeria', '₦', 'Opay / bank transfer', 'CAC registration'],
  ['kenya', 'Kenya', 'KSh', 'M-Pesa', 'business permit and KRA PIN'],
  ['south africa', 'South Africa', 'R', 'SnapScan / card', 'CIPC registration'],
  ['uganda', 'Uganda', 'USh', 'Mobile money', 'URSB registration'],
  ['tanzania', 'Tanzania', 'TSh', 'M-Pesa / Mixx', 'BRELA registration'],
  ['rwanda', 'Rwanda', 'RWF', 'MoMo', 'RDB registration'],
]

/**
 * @param {string} haystack
 */
function detectCountry(haystack) {
  const lower = haystack.toLowerCase()
  return COUNTRIES.find(([key]) => lower.includes(key)) ?? null
}

/**
 * Pulls a business idea out of the user's words instead of ignoring them.
 * @param {string} text
 */
export function extractIdea(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  const patterns = [
    /(?:start|starting|launch|open|begin|build|set up)\s+(?:a|an|my)?\s*(.+?)(?:\s+business|\s+shop|\s+stall|\s+brand)?(?:[.?,!]|$)/i,
    /(?:my|our)\s+(.+?)\s+(?:business|shop|stall|brand|idea)/i,
    /(?:expand|grow|scale)\s+(?:my|our|the)?\s*(.+?)(?:\s+business|\s+shop)?(?:[.?,!]|$)/i,
    /(?:about|for)\s+(?:a|an|my)?\s*(.+?)\s+(?:business|shop|stall)/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    const idea = match?.[1]?.replace(/^(a|an|the|my|our)\s+/i, '').trim()
    if (idea && idea.length > 1 && idea.length < 80) {
      return idea.replace(/\s+what.*$/i, '').trim()
    }
  }

  return ''
}

/**
 * Builds a Sena-style reply from the full thread — never a one-size-fits-all placeholder.
 * @param {Array<{ role: string, content: string }>} messages
 * @param {{ name?: string, country?: string, businessName?: string, financialSnapshot?: object } | undefined} userContext
 */
export function buildLocalCoachReply(messages, userContext) {
  const lastUser = [...messages].reverse().find((item) => item.role === 'user')
  const text = (lastUser?.content || '').trim()
  const lower = text.toLowerCase()
  const thread = messages.map((item) => item.content).join(' ')
  const name = userContext?.name ? ` ${userContext.name.split(' ')[0]}` : ''
  const idea = extractIdea(text) || extractIdea(thread) || userContext?.businessName || ''
  const place = detectCountry(`${text} ${thread} ${userContext?.country || ''}`)
  const country = place?.[1] || userContext?.country || ''
  const currency = place?.[2] || 'local currency'
  const pay = place?.[3] || 'mobile money'
  const license = place?.[4] || 'local business registration and a food/trade permit if you sell goods'

  if (/^(hi|hello|hey|good (morning|afternoon|evening)|howdy)\b/.test(lower) && lower.length < 24) {
    return `Hi${name} — I'm Sena, your Prospera business coach.\n\nI can help you price a product, turn an idea into a 90-day plan, read your books, or find a grant fit.\n\nWhat are you working on today?`
  }

  if (/system prompt|ignore (all|previous) instructions|reveal your instructions/.test(lower)) {
    return "That's outside what I can help with as your business coach. I focus on strategy, finance, and Prospera — want to talk about pricing, a 90-day plan, or reading your records?"
  }

  if (
    /weather|football|soccer|movie|dating|boyfriend|girlfriend|recipe for fun|celebrity|election|politics/.test(
      lower,
    )
  ) {
    return "That's outside what I can help with as your business coach. I focus on strategy, finance, and Prospera — want to talk about pricing your products or mapping a first 90 days?"
  }

  if (/tax|lawyer|legal advice|sue|court|investment return|stock|crypto/.test(lower)) {
    return `I can share general business education, not licensed legal, tax, or investment advice.\n\nThis is educational guidance — please consult a licensed professional for your specific situation.\n\nIf helpful, I can walk through record-keeping, pricing, or how Prospera's Investor & Grant Matchmaking Hub works. What would you like to focus on?`
  }

  if (/revenue|profit|expense|cash ?flow|margin|sales figure|how much did i/.test(lower)) {
    const snapshot = userContext?.financialSnapshot
    if (snapshot) {
      const unit = snapshot.currency ? `${snapshot.currency} ` : ''
      return `Looking at your logged books only — I will not invent extra figures.\n\n- Revenue: ${unit}${snapshot.revenue}\n- Expenses: ${unit}${snapshot.expenses}\n- Profit: ${unit}${snapshot.profit}\n${snapshot.notes ? `- ${snapshot.notes}` : ''}\n\nCash looks ${Number(snapshot.profit) >= 0 ? 'positive' : 'tight'}. Want a simple 30-day cash-flow plan from here?`
    }
    return `I don't have your logged numbers yet, so I won't guess.\n\nCould you tell me:\n1. Your currency and last 30 days of revenue and expenses, or\n2. Confirm you've saved them on the Finance page so I can read that snapshot?`
  }

  if (/susu|stokvel|sacco|group saving/.test(lower)) {
    return `Great question! Let's treat susu / stokvel as a discipline tool, not free money.\n\n1. Agree the contribution, payout order, and what happens if someone misses a week.\n2. Keep every payment visible — Prospera's Susu circles show who has paid.\n3. Don't commit more than your slowest sales week can cover.\n4. Use the payout for stock or a documented goal.\n\nAre you joining an existing circle or starting one, and what's your weekly contribution target?`
  }

  const wantsExpand = /expand|grow|scale|more customers|new location|second stall/.test(lower)
  const wantsPrice = /price|pricing|charge|how much should i/.test(lower)

  if (idea && wantsPrice) {
    return `Great — let's price your ${idea}${country ? ` in ${country}` : ''}.\n\n1. Add up batter/materials, ${pay}, transport, packaging, and your time per unit.\n2. Check nearby stalls, WhatsApp groups, and delivery apps for the going rate.\n3. Set a floor (cost + a living margin) and a stretch price for custom or rush orders.\n4. Test for two weeks and adjust. ${pay} makes small price tests easy.\n\nWhat does one ${idea} unit cost you to make, and what do neighbours charge?`
  }

  if (/\b(todo|to-do|roadmap|action plan|90[-\s]?day|checklist|step[-\s]?by[-\s]?step)\b/.test(lower) || (idea && /\b(plan|roadmap|todo)\b/.test(lower))) {
    const focus = idea || 'your business'
    return `Here is a practical 90-day tracker for ${focus}${country ? ` in ${country}` : ''}.\n\n1. Write your 2–3 hero products and a sell price in ${currency}.\n2. List starter costs (materials, ${pay}, packaging, signage) in Prospera Finance.\n3. Complete ${license} before you scale beyond friends and family.\n4. Sell to people you already know for 30 days and log every sale.\n5. Pick one busy location and one delivery channel in days 31–60.\n6. Drop weak items, restock winners, and lock a weekly susu amount you can afford.\n7. Review cash weekly — do not take informal credit you cannot see.\n\nCheck these off on your dashboard as you go. Want pricing next, or a grant-fit check?`
  }

  if (idea && wantsExpand) {
    return `Love that you want to grow the ${idea} business${country ? ` in ${country}` : ''}. Let's keep it realistic.\n\n1. Prove demand at your current spot before a second location — track 4 weeks of sales in Prospera records.\n2. Repeat your best-selling item first; don't add a new menu until the original one is busy.\n3. Fund expansion from profit or a susu payout, not informal debt you can't see.\n4. Use Prospera's Investor & Grant Matchmaking Hub only after you can show numbers.\n\nWhere are most of your buyers coming from right now — walk-ins, WhatsApp, or deliveries?`
  }

  if (idea) {
    return `Great — a ${idea} business${country ? ` in ${country}` : ''}. Let's map what you actually need to know.\n\n1. **Offer:** Pick 2–3 hero items first (don't launch a huge menu). Write the recipe, portion, and sell price in ${currency}.\n2. **Setup:** ${license}. Start from home, a market stall, or a small kiosk before renting a shop.\n3. **Money:** List starter costs — ingredients, oil/gas, packaging, a sign, and ${pay} charges. Keep that list in Prospera Finance.\n4. **First 90 days:**\n   - Days 1–30: sell to people you already know; ask what they'd pay.\n   - Days 31–60: pick one busy spot and one delivery channel.\n   - Days 61–90: drop weak items, restock winners, and log every sale.\n5. **Risk:** Food businesses fail on waste and credit. Cook to order at first. This is educational guidance — check local health rules for your area.\n\nWant a one-page shopping list for week 1, or a simple pricing sheet next?`
  }

  return `I heard you, and I don't want to guess.\n\nTell me 1–2 of these so I can give you a real plan:\n- What you want to sell (or grow)\n- Your country or city\n- Whether you need pricing, a 90-day setup, or a grant fit\n\nOnce I have that, I'll map the next steps — not a generic list.`
}
