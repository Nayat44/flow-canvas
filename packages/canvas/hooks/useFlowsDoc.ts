import { useCallback, useEffect, useRef, useState } from 'react'

import { FLOW_CANVAS_ASSET_BASE, FLOW_CANVAS_SAVE_URL, SAVE_DEBOUNCE_MS } from '../constants'
import type { FlowsDoc } from '../types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'read-only'

type State = {
  doc: FlowsDoc | null
  isLoading: boolean
  error: string | null
}

export type FlowsDocApi = State & {
  saveState: SaveState
  saveError: string | null
  /** Replaces the whole document and persists it (dev only). */
  update: (next: FlowsDoc) => void
}

/**
 * Loads public/flow-canvas/flows.json at runtime and — in dev — writes edits back
 * to it through the flow-canvas-writer middleware. The document is the artifact,
 * so editing a note on the canvas edits the file, not some parallel copy.
 */
export function useFlowsDoc(): FlowsDocApi {
  const [state, setState] = useState<State>({ doc: null, isLoading: true, error: null })
  const [saveState, setSaveState] = useState<SaveState>(FLOW_CANVAS_SAVE_URL ? 'idle' : 'read-only')
  const [saveError, setSaveError] = useState<string | null>(null)
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${FLOW_CANVAS_ASSET_BASE}flows.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`flows.json responded ${response.status}`)
        return response.json() as Promise<FlowsDoc>
      })
      .then((doc) => {
        if (!cancelled) setState({ doc, isLoading: false, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({ doc: null, isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => () => (pendingSave.current ? clearTimeout(pendingSave.current) : undefined), [])

  const update = useCallback((next: FlowsDoc) => {
    setState((current) => ({ ...current, doc: next }))

    const saveUrl = FLOW_CANVAS_SAVE_URL
    if (!saveUrl) {
      setSaveState('read-only')
      return
    }

    // Coalesce keystrokes into one write.
    if (pendingSave.current) clearTimeout(pendingSave.current)
    setSaveState('saving')
    pendingSave.current = setTimeout(() => {
      fetch(saveUrl, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next)
      })
        .then(async (response) => {
          if (!response.ok) throw new Error((await response.text()) || `save responded ${response.status}`)
          setSaveError(null)
          setSaveState('saved')
        })
        .catch((error: unknown) => {
          setSaveError(error instanceof Error ? error.message : 'Unknown error')
          setSaveState('error')
        })
    }, SAVE_DEBOUNCE_MS)
  }, [])

  return { ...state, saveState, saveError, update }
}
