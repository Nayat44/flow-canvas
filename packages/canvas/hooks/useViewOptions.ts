import { useCallback, useState } from 'react'

import { ALL_FLOWS } from '../constants'

export type ViewOptions = {
  activeFlow: string
  setActiveFlow: (next: string) => void
  showLive: boolean
  setShowLive: (next: boolean) => void
}

/**
 * Keeps the lane filter and live-mode flag in the URL query so a review comment can
 * link one lane in the mode it should be read in.
 *
 * Deliberately router-agnostic — it reads and writes `window.location` through the
 * History API. If your app uses react-router, swap the body for `useSearchParams`
 * so navigation stays in the router's hands.
 */
export function useViewOptions(): ViewOptions {
  const read = () => new URLSearchParams(window.location.search)
  const [params, setParams] = useState(read)

  const update = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(window.location.search)
    if (value === null) next.delete(key)
    else next.set(key, value)
    const query = next.toString()
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
    setParams(next)
  }, [])

  return {
    activeFlow: params.get('flow') ?? ALL_FLOWS,
    setActiveFlow: (next) => update('flow', next === ALL_FLOWS ? null : next),
    showLive: params.get('live') === '1',
    setShowLive: (next) => update('live', next ? '1' : null)
  }
}
