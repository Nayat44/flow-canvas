import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react'
import { toPng } from 'html-to-image'

import { ScreenNode } from './components/ScreenNode'
import { NoteNode } from './components/NoteNode'
import { StageNode } from './components/StageNode'
import { BandNode } from './components/BandNode'
import { useViewOptions } from './hooks/useViewOptions'
import { ActionEdge } from './components/ActionEdge'
import { FlowToolbar } from './components/FlowToolbar'
import { ScreenInspector } from './components/ScreenInspector'
import { useFlowsDoc } from './hooks/useFlowsDoc'
import { FlowCanvasEditContext, type LabelTarget, type NotesTarget } from './edit-context'
import { buildGraph } from './utils/buildGraph'
import { ALL_FLOWS, FLOW_CANVAS_ASSET_BASE, FLOW_CANVAS_SAVE_URL } from './constants'
import type { CanvasEdge, CanvasNode, FlowsDoc, FlowTransition, Offset, ScreenNodeData } from './types'

import './flow-canvas.css'

// Hoisted: re-created maps make React Flow warn and re-render on every pan.
const nodeTypes = { screen: ScreenNode, note: NoteNode, stage: StageNode, band: BandNode }
const edgeTypes = { action: ActionEdge }

const LEGEND = [
  { label: 'happy path', color: 'var(--fc-primary)' },
  { label: 'alternate route', color: 'var(--fc-alt)' },
  { label: 'error / blocked', color: 'var(--fc-error)' },
  { label: 'back / cancel', color: 'var(--fc-back)' }
]

const Canvas: FC = () => {
  const { doc, isLoading, error, saveState, saveError, update } = useFlowsDoc()
  const [showNotes, setShowNotes] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [inspected, setInspected] = useState<ScreenNodeData | null>(null)
  // ?flow=<id> and ?live=1 live in the URL so a review comment can link one lane,
  // in the mode it should be read in.
  const { activeFlow, setActiveFlow, showLive, setShowLive } = useViewOptions()
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { fitView } = useReactFlow()

  const canEdit = Boolean(FLOW_CANVAS_SAVE_URL)

  const graph = useMemo(
    () =>
      doc
        ? buildGraph(doc, {
            showNotes,
            showHotspots,
            showLive,
            // 14 frames at once would boot 14 app instances; only auto-mount them
            // once the reader has narrowed to a single lane.
            autoLoadLive: activeFlow !== ALL_FLOWS,
            allowEmptyNotes: canEdit,
            assetBase: FLOW_CANVAS_ASSET_BASE
          })
        : { nodes: [], edges: [], lanes: [] },
    [doc, showNotes, showHotspots, showLive, activeFlow, canEdit]
  )

  useEffect(() => {
    const inFlow = (flowId: string) => activeFlow === ALL_FLOWS || flowId === activeFlow
    setNodes(graph.nodes.filter((node) => inFlow(node.data.flowId)))
    setEdges(graph.edges.filter((edge) => inFlow(edge.data?.flowId ?? '')))
  }, [graph, activeFlow, setNodes, setEdges])

  // Refit on view changes only — a note edit re-renders the graph, and moving the
  // viewport out from under the editor would be maddening. Twice, because the
  // screenshots land after mount and change every card's height: the first pass
  // frames what is measured so far, the second frames the loaded graph.
  useEffect(() => {
    const timers = [
      setTimeout(() => fitView({ padding: 0.15, duration: 200 }), 250),
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 1200)
    ]
    return () => timers.forEach(clearTimeout)
  }, [activeFlow, showNotes, showHotspots, showLive, nodes.length, fitView])

  const setNotes = useCallback(
    (target: NotesTarget, notes: string[]) => {
      if (!doc) return
      const next: FlowsDoc = {
        ...doc,
        flows: doc.flows.map((flow) => {
          if (flow.id !== target.flowId) return flow
          if (target.kind === 'flow') return { ...flow, notes }
          return {
            ...flow,
            screens: (flow.screens ?? []).map((screen) =>
              screen.id === target.screenId ? { ...screen, notes } : screen
            )
          }
        })
      }
      update(next)
      // Keep an open inspector in sync with what was just typed.
      setInspected((current) =>
        current && target.kind === 'screen' && current.id === target.screenId ? { ...current, notes } : current
      )
    },
    [doc, update]
  )

  const removeNote = useCallback(
    (target: NotesTarget, index: number) => {
      if (!doc) return
      const flow = doc.flows.find((candidate) => candidate.id === target.flowId)
      if (!flow) return
      const current =
        target.kind === 'flow'
          ? (flow.notes ?? [])
          : ((flow.screens ?? []).find((screen) => screen.id === target.screenId)?.notes ?? [])
      setNotes(
        target,
        current.filter((_, position) => position !== index)
      )
    },
    [doc, setNotes]
  )

  const storedNoteOffset = useCallback(
    (target: NotesTarget): Offset => {
      const flow = doc?.flows.find((candidate) => candidate.id === target.flowId)
      if (!flow) return { x: 0, y: 0 }
      const offset =
        target.kind === 'flow'
          ? flow.noteOffset
          : (flow.screens ?? []).find((screen) => screen.id === target.screenId)?.noteOffset
      return offset ?? { x: 0, y: 0 }
    },
    [doc]
  )

  const setNoteOffset = useCallback(
    (target: NotesTarget, offset: Offset) => {
      if (!doc) return
      update({
        ...doc,
        flows: doc.flows.map((flow) => {
          if (flow.id !== target.flowId) return flow
          if (target.kind === 'flow') return { ...flow, noteOffset: offset }
          return {
            ...flow,
            screens: (flow.screens ?? []).map((screen) =>
              screen.id === target.screenId ? { ...screen, noteOffset: offset } : screen
            )
          }
        })
      })
    },
    [doc, update]
  )

  const patchTransition = useCallback(
    (target: LabelTarget, patch: () => Partial<FlowTransition>) => {
      if (!doc) return
      update({
        ...doc,
        flows: doc.flows.map((flow) =>
          flow.id === target.flowId
            ? {
                ...flow,
                transitions: (flow.transitions ?? []).map((transition, index) =>
                  index === target.transitionIndex ? { ...transition, ...patch() } : transition
                )
              }
            : flow
        )
      })
    },
    [doc, update]
  )

  const setLabel = useCallback(
    (target: LabelTarget, label: { action: string; condition: string }) =>
      patchTransition(target, () => ({
        // Undefined rather than empty string: the schema treats a missing action as
        // "no label", and an empty condition line would render as a stray 'if'.
        action: label.action || undefined,
        condition: label.condition || undefined
      })),
    [patchTransition]
  )

  const setLabelOffset = useCallback(
    (target: LabelTarget, offset: Offset) => patchTransition(target, () => ({ labelOffset: offset })),
    [patchTransition]
  )

  const editApi = useMemo(
    () => ({ canEdit, setNotes, removeNote, setNoteOffset, setLabel, setLabelOffset }),
    [canEdit, setNotes, removeNote, setNoteOffset, setLabel, setLabelOffset]
  )

  const exportPng = useCallback(() => {
    const viewport = wrapperRef.current?.querySelector<HTMLElement>('.react-flow__viewport')
    if (!viewport || !wrapperRef.current) return
    // Resolve the token to a literal colour — html-to-image clones the node out
    // of the cascade, so a var() reference would come out transparent.
    const backgroundColor = window.getComputedStyle(wrapperRef.current).backgroundColor
    toPng(viewport, { backgroundColor, pixelRatio: 2 }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `${doc?.project ?? 'flow'}-canvas.png`
      link.href = dataUrl
      link.click()
    })
  }, [doc])

  if (isLoading) return <div className="fc-state">Loading flows…</div>

  if (error || !doc) {
    return (
      <div className="fc-state">
        Couldn&apos;t load the flow document — {error ?? 'public/flow-canvas/flows.json is missing'}
      </div>
    )
  }

  return (
    <FlowCanvasEditContext.Provider value={editApi}>
      <div className="fc-root">
      <FlowToolbar
        project={doc.project}
        version={doc.version}
        lanes={graph.lanes}
        activeFlow={activeFlow}
        onActiveFlowChange={setActiveFlow}
        showHotspots={showHotspots}
        onShowHotspotsChange={setShowHotspots}
        showNotes={showNotes}
        onShowNotesChange={setShowNotes}
        showLive={showLive}
        onShowLiveChange={setShowLive}
        onExportPng={exportPng}
        saveState={saveState}
        saveError={saveError}
      />

      {/* React Flow needs an explicit height — a flex/auto parent renders nothing.
          Override --fc-height on .flow-canvas to change it. */}
      <div ref={wrapperRef} className="fc-viewport">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setInspected(node.type === 'screen' ? (node.data as ScreenNodeData) : null)}
          onPaneClick={() => setInspected(null)}
          onNodeDragStop={(_, node) => {
            const target = (node.data as { target?: NotesTarget }).target
            if (node.type !== 'note' || !target) return
            const laidOut = graph.nodes.find((candidate) => candidate.id === node.id)
            if (!laidOut) return
            // The laid-out position already includes the stored offset, so add the
            // drag delta to it. A layout change then moves the note with its card
            // instead of stranding it at absolute coordinates.
            const stored = storedNoteOffset(target)
            setNoteOffset(target, {
              x: Math.round(stored.x + node.position.x - laidOut.position.x),
              y: Math.round(stored.y + node.position.y - laidOut.position.y)
            })
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesConnectable={false}
          // Double-click belongs to the note editor, not the zoom.
          zoomOnDoubleClick={false}
          fitView
          minZoom={0.1}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable maskColor="var(--color-alpha-60)" />

          {/* Bottom edges belong to <Controls> and <MiniMap>; the top-right corner
              is the only one that never sits over a card or an open note editor. */}
          <Panel position="top-right" className="fc-legend">
            {LEGEND.map((item) => (
              <span key={item.label}>
                <i style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </Panel>
        </ReactFlow>

        {inspected && <ScreenInspector screen={inspected} onClose={() => setInspected(null)} />}
      </div>
      </div>
    </FlowCanvasEditContext.Provider>
  )
}

export const FlowCanvas: FC = () => (
  <div className="flow-canvas">
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  </div>
)
