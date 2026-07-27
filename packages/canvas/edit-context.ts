import { createContext, useContext } from 'react'

import type { Offset } from './types'

/** Which set of notes an editor is bound to. */
export type NotesTarget = { kind: 'screen'; flowId: string; screenId: string } | { kind: 'flow'; flowId: string }

/** Which transition's label an editor is bound to. */
export type LabelTarget = { flowId: string; transitionIndex: number }

export type FlowCanvasEditApi = {
  /** False in production builds — there is no dev server to write flows.json. */
  canEdit: boolean
  setNotes: (target: NotesTarget, notes: string[]) => void
  /** Drops a single note by index. */
  removeNote: (target: NotesTarget, index: number) => void
  /** Persists a dragged sticky note, as an offset from its laid-out spot. */
  setNoteOffset: (target: NotesTarget, offset: Offset) => void
  /** Rewrites an edge label. Clearing the action hides the label but keeps the arrow. */
  setLabel: (target: LabelTarget, label: { action: string; condition: string }) => void
  /** Persists a dragged edge label. */
  setLabelOffset: (target: LabelTarget, offset: Offset) => void
}

/**
 * Editing is passed through context rather than node/edge data so those stay plain
 * serialisable objects (and React Flow's memo comparisons keep working).
 */
export const FlowCanvasEditContext = createContext<FlowCanvasEditApi>({
  canEdit: false,
  setNotes: () => undefined,
  removeNote: () => undefined,
  setNoteOffset: () => undefined,
  setLabel: () => undefined,
  setLabelOffset: () => undefined
})

export function useFlowCanvasEdit(): FlowCanvasEditApi {
  return useContext(FlowCanvasEditContext)
}
