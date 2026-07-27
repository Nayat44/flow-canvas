import type { Edge, Node } from '@xyflow/react'

import type { NotesTarget } from './edit-context'

// Shape of public/flow-canvas/flows.json. Object types (not interfaces) so they
// satisfy React Flow's `Record<string, unknown>` data constraint.

export type Offset = { x: number; y: number }

export type Hotspot = {
  id: string
  label: string
  x: number
  y: number
  w?: number
  h?: number
  note?: string
}

export type ScreenStatus = 'ready' | 'wip' | 'needs-review'
export type NoteTone = 'default' | 'warn' | 'flow'

export type FlowScreen = {
  id: string
  title: string
  route?: string
  image?: string
  /** In-app URL that renders this state for real. Powers the live preview and the "Open live" link. */
  live?: string
  /** Extra clicks needed after opening `live`, when the state has no direct URL. */
  liveHint?: string
  status?: ScreenStatus
  description?: string
  notes?: string[]
  noteTone?: NoteTone
  hotspots?: Hotspot[]
  /** Nudge applied to this screen's sticky note, relative to its laid-out spot. */
  noteOffset?: Offset
}

export type FlowStage = {
  id: string
  kind: 'start' | 'end' | 'decision'
  label: string
}

export type TransitionVariant = 'primary' | 'alt' | 'error' | 'back'

export type FlowTransition = {
  from: string
  to: string
  fromHotspot?: string
  action?: string
  condition?: string
  variant?: TransitionVariant
  /** Nudge applied to the label, in canvas units, so it can be dragged clear of a card. */
  labelOffset?: Offset
}

export type Flow = {
  id: string
  name: string
  description?: string
  notes?: string[]
  /** Nudge applied to the flow-notes sticky. */
  noteOffset?: Offset
  stages?: FlowStage[]
  screens?: FlowScreen[]
  transitions?: FlowTransition[]
}

export type FlowsDoc = {
  project: string
  version?: string
  flows: Flow[]
}

// --- React Flow bindings ---

export type ScreenNodeData = FlowScreen & {
  flowId: string
  flowName: string
  showHotspots: boolean
  /** Swaps the screenshot for an interactive frame of `live`. */
  showLive: boolean
  /** Mount the frame without waiting for a click. Only when one lane is filtered in. */
  autoLoadLive: boolean
}

export type NoteNodeData = {
  title: string
  items: string[]
  tone: NoteTone
  flowId: string
  /** Which notes array in flows.json this sticky note writes back to. */
  target: NotesTarget
}

export type StageNodeData = FlowStage & { flowId: string }

export type BandNodeData = {
  name: string
  description?: string
  width: number
  flowId: string
}

export type ScreenFlowNode = Node<ScreenNodeData, 'screen'>
export type NoteFlowNode = Node<NoteNodeData, 'note'>
export type StageFlowNode = Node<StageNodeData, 'stage'>
export type BandFlowNode = Node<BandNodeData, 'band'>
export type CanvasNode = ScreenFlowNode | NoteFlowNode | StageFlowNode | BandFlowNode

export type ActionEdgeData = {
  action?: string
  condition?: string
  variant: TransitionVariant
  flowId: string
  /** Index into the flow's transitions array — the write-back address. */
  transitionIndex: number
  labelOffset?: Offset
}

export type CanvasEdge = Edge<ActionEdgeData>

export type Lane = {
  id: string
  name: string
  description?: string
  screenCount: number
}
