/**
 * @param {{ tasks?: Array<{ done?: boolean }> } | null | undefined} tracker
 */
export function trackerProgress(tracker) {
  const tasks = tracker?.tasks || []
  const total = tasks.length
  const done = tasks.filter((task) => task.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { done, total, percent }
}
