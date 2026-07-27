/** Sentinel for "no flow filter" in the flow dropdown. */
export const ALL_FLOWS = 'all'

/** flows.json and its screenshots live in public/flow-canvas/. */
export const FLOW_CANVAS_ASSET_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/flow-canvas/`

/**
 * Endpoint served by the flow-canvas-writer vite plugin. Dev only — a deployed
 * canvas has nothing to write to, so notes are read-only there.
 */
export const FLOW_CANVAS_SAVE_URL = import.meta.env.DEV ? '/__flow-canvas/flows.json' : null

/** Keystrokes are coalesced into one write. */
export const SAVE_DEBOUNCE_MS = 600

/** Card width. Kept in sync with the fixed node size dagre lays out with. */
export const SCREEN_NODE_WIDTH = 440

/** Viewport the live iframe renders at before it is scaled down into the card. */
export const LIVE_FRAME_WIDTH = 720
export const LIVE_FRAME_HEIGHT = 780
