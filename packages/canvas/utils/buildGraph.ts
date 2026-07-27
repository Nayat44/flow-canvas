import dagre from '@dagrejs/dagre'
import { MarkerType } from '@xyflow/react'

import { SCREEN_NODE_WIDTH } from '../constants'
import type { CanvasEdge, CanvasNode, FlowsDoc, Lane, TransitionVariant } from '../types'

const SCREEN_W = SCREEN_NODE_WIDTH
// Fixed node size keeps the layout deterministic across reloads — worth it for a
// document people screenshot. A 440px-wide full-page screenshot is ~290px tall,
// so the card lands at ~340 with its header; the rank also has to swallow the
// sticky note parked underneath it.
const SCREEN_H = 530
const NOTE_OFFSET_Y = 360
const STAGE_W = 170
const STAGE_H = 64
const NOTE_W = 240
const LANE_GAP = 200
const LANE_PAD = 230
const BAND_H = 90

type BuildOptions = {
  showNotes: boolean
  showHotspots: boolean
  showLive: boolean
  autoLoadLive: boolean
  /** Render a sticky note even when a screen has none yet, so one can be typed in. */
  allowEmptyNotes: boolean
  /** Prefix for screenshot paths, which are stored relative to public/flow-canvas/. */
  assetBase: string
}

export type CanvasGraph = {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  lanes: Lane[]
}

/**
 * flows.json -> React Flow nodes/edges. Each flow is laid out left-to-right with
 * its own dagre graph, then stacked as a lane so one journey reads per row.
 */
export function buildGraph(
  doc: FlowsDoc,
  { showNotes, showHotspots, showLive, autoLoadLive, allowEmptyNotes, assetBase }: BuildOptions
): CanvasGraph {
  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []
  const lanes: Lane[] = []
  let laneTop = 0

  for (const flow of doc.flows) {
    const graph = new dagre.graphlib.Graph()
    graph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 200, marginx: 20, marginy: 20 })
    graph.setDefaultEdgeLabel(() => ({}))

    const screens = flow.screens ?? []
    const stages = flow.stages ?? []
    const transitions = flow.transitions ?? []

    for (const screen of screens) graph.setNode(screen.id, { width: SCREEN_W, height: SCREEN_H })
    for (const stage of stages) graph.setNode(stage.id, { width: STAGE_W, height: STAGE_H })
    for (const transition of transitions) {
      if (graph.hasNode(transition.from) && graph.hasNode(transition.to)) {
        graph.setEdge(transition.from, transition.to)
      }
    }

    // A flow with no transitions is a catalogue, not a journey — dagre would stack
    // every screen in one rank. Lay those out as a single row instead.
    const isCatalogue = transitions.length === 0
    if (isCatalogue) {
      screens.forEach((screen, index) => {
        graph.setNode(screen.id, {
          width: SCREEN_W,
          height: SCREEN_H,
          x: 20 + SCREEN_W / 2 + index * (SCREEN_W + 80),
          y: 20 + SCREEN_H / 2
        })
      })
      graph.graph().width = 40 + screens.length * (SCREEN_W + 80)
      graph.graph().height = SCREEN_H + 40
    } else {
      dagre.layout(graph)
    }

    const laneHeight = (graph.graph().height ?? SCREEN_H) + LANE_PAD + BAND_H
    // dagre returns centre coordinates; React Flow wants top-left.
    const topLeft = (id: string, width: number, height: number) => {
      const node = graph.node(id) as { x?: number; y?: number } | undefined
      return {
        x: (node?.x ?? 0) - width / 2,
        y: laneTop + LANE_PAD / 2 + (node?.y ?? 0) - height / 2
      }
    }

    lanes.push({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      screenCount: screens.length
    })

    for (const screen of screens) {
      const position = topLeft(screen.id, SCREEN_W, SCREEN_H)
      nodes.push({
        id: screen.id,
        type: 'screen',
        position,
        data: {
          ...screen,
          image: screen.image ? `${assetBase}${screen.image}` : undefined,
          flowId: flow.id,
          flowName: flow.name,
          showHotspots,
          showLive,
          autoLoadLive
        }
      })

      if (showNotes && (screen.notes?.length || allowEmptyNotes)) {
        const noteId = `${screen.id}__note`
        nodes.push({
          id: noteId,
          type: 'note',
          position: {
            x: position.x + (SCREEN_W - NOTE_W) / 2 + (screen.noteOffset?.x ?? 0),
            y: position.y + NOTE_OFFSET_Y + (screen.noteOffset?.y ?? 0)
          },
          data: {
            title: `${screen.title} — notes`,
            items: screen.notes ?? [],
            tone: screen.noteTone ?? 'default',
            flowId: flow.id,
            target: { kind: 'screen', flowId: flow.id, screenId: screen.id }
          }
        })
        edges.push({
          id: `e-${noteId}`,
          source: screen.id,
          target: noteId,
          sourceHandle: 'out',
          targetHandle: 'in',
          type: 'straight',
          style: { stroke: 'var(--color-border-subtle)', strokeDasharray: '4 4' },
          selectable: false,
          // Note connectors have no transition behind them; -1 marks "not editable".
          data: { variant: 'back', flowId: flow.id, transitionIndex: -1 },
          zIndex: 0
        })
      }
    }

    for (const stage of stages) {
      nodes.push({
        id: stage.id,
        type: 'stage',
        position: topLeft(stage.id, STAGE_W, STAGE_H),
        data: { ...stage, flowId: flow.id }
      })
    }

    transitions.forEach((transition, index) => {
      const variant: TransitionVariant = transition.variant ?? 'primary'
      const color = edgeColor(variant)
      edges.push({
        id: `${flow.id}-t${index}`,
        source: transition.from,
        target: transition.to,
        sourceHandle: transition.fromHotspot ?? 'out',
        targetHandle: 'in',
        type: 'action',
        animated: variant === 'primary',
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color },
        style: {
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: variant === 'error' || variant === 'alt' ? '6 4' : undefined
        },
        data: {
          action: transition.action,
          condition: transition.condition,
          variant,
          flowId: flow.id,
          transitionIndex: index,
          labelOffset: transition.labelOffset
        }
        // No zIndex: lifting the edge layer puts it above the label renderer, and
        // the labels stop receiving pointer events (so they can't be dragged).
      })
    })

    nodes.push({
      id: `${flow.id}__band`,
      type: 'band',
      position: { x: 0, y: laneTop + 20 },
      data: {
        name: flow.name,
        description: flow.description,
        width: Math.max(graph.graph().width ?? 900, 900),
        flowId: flow.id
      },
      selectable: false,
      draggable: false
    })

    if (showNotes && (flow.notes?.length || allowEmptyNotes)) {
      nodes.push({
        id: `${flow.id}__flownote`,
        type: 'note',
        position: {
          x: -NOTE_W - 80 + (flow.noteOffset?.x ?? 0),
          y: laneTop + LANE_PAD / 2 + (flow.noteOffset?.y ?? 0)
        },
        data: {
          title: `${flow.name} — flow notes`,
          items: flow.notes ?? [],
          tone: 'flow',
          flowId: flow.id,
          target: { kind: 'flow', flowId: flow.id }
        }
      })
    }

    laneTop += laneHeight + LANE_GAP
  }

  return { nodes, edges, lanes }
}

function edgeColor(variant: TransitionVariant): string {
  switch (variant) {
    case 'alt':
      return 'var(--color-info-primary)'
    case 'error':
      return 'var(--color-negative-primary)'
    case 'back':
      return 'var(--color-fg-muted)'
    default:
      return 'var(--color-brand-primary)'
  }
}
