const PLAN_HINT =
  /\b(todo|to-do|to do|roadmap|action plan|90[-\s]?day|checklist|milestones?|step[-\s]?by[-\s]?step|tasks?|give me (a |the )?(plan|list|steps)|create (a |an )?(plan|list|tracker))\b/i

const ADVICE_HINT =
  /\b(how do i start|help me (start|launch|plan|build|price)|startup plan|business plan|next (90|thirty|30) days)\b/i

/**
 * @param {string} reply
 * @returns {string[]}
 */
export function extractTasks(reply) {
  const tasks = []
  for (const line of String(reply || '').split('\n')) {
    const match = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(?:\*\*)?(.+?)(?:\*\*)?\s*$/)
    if (!match) continue
    const text = match[1]
      .replace(/\*\*/g, '')
      .replace(/^\[[ xX]\]\s*/, '')
      .trim()
    if (text.endsWith('?')) continue
    if (text.length > 8 && text.length < 180) tasks.push(text)
  }
  return [...new Set(tasks)].slice(0, 12)
}

/**
 * @param {string} userText
 * @param {string[]} tasks
 */
export function shouldCreateTracker(userText, tasks) {
  if (tasks.length < 3) return false
  if (PLAN_HINT.test(userText)) return true
  return ADVICE_HINT.test(userText) && tasks.length >= 4
}

/**
 * @param {string} userText
 * @param {string} reply
 */
export function trackerTitle(userText, reply) {
  const heading = String(reply || '').match(/^#{1,3}\s+(.+)$/m)
  if (heading?.[1]) return heading[1].replace(/\*\*/g, '').trim().slice(0, 80)
  const cleaned = String(userText || '')
    .replace(/^(can you|please|help me|give me|create|make|i want|i need)\s+/i, '')
    .trim()
  return (cleaned || 'Sena action plan').slice(0, 72)
}

/**
 * Builds a dashboard tracker from a finished Sena reply, or null.
 * @param {string} userText
 * @param {string} reply
 */
export function buildTrackerEvent(userText, reply) {
  const tasks = extractTasks(reply)
  if (!shouldCreateTracker(userText, tasks)) return null
  return {
    title: trackerTitle(userText, reply),
    tasks,
  }
}
