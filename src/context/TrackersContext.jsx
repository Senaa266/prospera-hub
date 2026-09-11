import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'prospera-trackers'
const TrackersContext = createContext(null)

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadTrackers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Persists Sena-generated action plans so Dashboard and tracker pages stay in sync.
 */
export function TrackersProvider({ children }) {
  const [trackers, setTrackers] = useState(loadTrackers)
  const [latestId, setLatestId] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackers))
  }, [trackers])

  const addTracker = useCallback((payload) => {
    const title = String(payload?.title || 'Sena action plan').slice(0, 90)
    const tasks = (payload?.tasks || [])
      .map((item) => {
        const text = typeof item === 'string' ? item : item?.text
        if (!text) return null
        return {
          id: item?.id || createId('task'),
          text: String(text).slice(0, 180),
          done: Boolean(item?.done),
        }
      })
      .filter(Boolean)

    if (tasks.length < 2) return null

    const tracker = {
      id: payload?.id || createId('tracker'),
      title,
      createdAt: new Date().toISOString(),
      source: 'sena',
      tasks,
    }
    setTrackers((current) => [tracker, ...current.filter((item) => item.title !== title)])
    setLatestId(tracker.id)
    return tracker
  }, [])

  const toggleTask = useCallback((trackerId, taskId) => {
    setTrackers((current) =>
      current.map((tracker) =>
        tracker.id !== trackerId
          ? tracker
          : {
              ...tracker,
              tasks: tracker.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            },
      ),
    )
  }, [])

  const removeTracker = useCallback((trackerId) => {
    setTrackers((current) => current.filter((item) => item.id !== trackerId))
  }, [])

  const value = useMemo(
    () => ({ trackers, latestId, addTracker, toggleTask, removeTracker }),
    [trackers, latestId, addTracker, toggleTask, removeTracker],
  )

  return <TrackersContext.Provider value={value}>{children}</TrackersContext.Provider>
}

export function useTrackers() {
  const value = useContext(TrackersContext)
  if (!value) {
    throw new Error('useTrackers must be used inside TrackersProvider')
  }
  return value
}
