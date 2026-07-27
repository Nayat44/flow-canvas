# React Flow patterns used by the flow canvas

Targets React Flow v12 (`@xyflow/react` 12.11+). The v11 package name `reactflow` is
deprecated — never mix imports from both.

## Contents
- Anchoring an edge to a click target
- Re-measuring handles
- Custom edges with labels
- Making a label draggable and editable
- Layout with dagre
- Editing without putting callbacks in node data
- Things that break

## Anchoring an edge to a click target

The core trick. A `<Handle>` can live anywhere inside a custom node, and React Flow
reads its position from the DOM — so a handle inside an absolutely-positioned hotspot
div lands exactly on the button.

```jsx
<div className="hotspot" style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}>
  <Handle type="source" position={Position.Right} id={h.id} className="rf-handle-hotspot" />
</div>
```

The edge references the handle by id:

```js
{ source: 'list', sourceHandle: 'list__new', target: 'form' }
```

**The CSS gotcha:** React Flow pins `.react-flow__handle-right` to the *node* edge.
Override it back onto the hotspot parent:

```css
.rf-handle-hotspot {
  position: absolute !important;
  right: -5px !important;
  left: auto !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}
```

`position={Position.Right}` still matters even with the override — it tells React Flow
which way the edge leaves, which stops smoothstep paths looping back on themselves.

Hotspots that are hidden (live mode, or the "Click targets" toggle off) must stay
**mounted** with `opacity-0 pointer-events-none`, not unmounted, or their edges lose
their anchor.

## Re-measuring handles

Handles are measured once on mount. Anything that adds, removes or moves them after
that needs a re-measure or the edges snap to the node origin:

```jsx
const updateNodeInternals = useUpdateNodeInternals()
useEffect(() => {
  updateNodeInternals(id)
}, [id, hotspots.length, data.showHotspots, showFrame, updateNodeInternals])
```

Symptom to recognise: every arrow converges on the top-left corner of a card.

## Custom edges with labels

`getSmoothStepPath` returns `[path, labelX, labelY]`. Render the label through
`<EdgeLabelRenderer>` so it sits in a DOM layer above the SVG and stays legible at any
zoom. The renderer layer sets `pointer-events: none`, so the label itself needs
`pointer-events: all`.

Arrowheads come from `markerEnd: { type: MarkerType.ArrowClosed, color }` — set the
colour to match `style.stroke` or the head renders black.

**Never set `zIndex` on an edge you want an interactive label on.** A `zIndex` lifts
that edge's SVG group above `.react-flow__edgelabel-renderer`, and the edge path then
receives every pointer event aimed at the label. Symptom: the label is visible, hover
does nothing, drag does nothing, and `document.elementFromPoint()` over the label
returns a `path`. Verified fix: drop the `zIndex`.

## Making a label draggable and editable

Position is `translate(-50%,-50%) translate(labelX + offset.x, labelY + offset.y)`,
where `offset` is persisted on the transition. Two details:

- **Deltas are screen pixels, the canvas is in flow units.** Divide by
  `useReactFlow().getZoom()` or the label runs away from the cursor when zoomed out.
- **Use window listeners, not `setPointerCapture`.** Capture needs a real `pointerId`
  (synthesized events may not have one) and the pointer regularly leaves a label this
  small mid-drag. Listen for both `pointermove`/`mousemove` and `pointerup`/`mouseup`.

`stopPropagation()` on pointer/mouse down, plus `nodrag nowheel` on inputs, keeps the
canvas from panning underneath the interaction.

## Layout with dagre

`@dagrejs/dagre` with `rankdir: 'LR'` per flow, then each lane offset vertically.
Feeding dagre a **fixed** node size rather than measured sizes keeps the layout
identical across reloads — worth it for a document people screenshot.

dagre returns *centre* coordinates; React Flow wants *top-left*, hence the
`x - width / 2` offset.

Two sizing rules learned the hard way:

- The rank height must cover the card **and** the sticky note parked under it, or
  ranks overlap. Budget `card height + gap + note height`.
- A flow with no transitions puts every node in rank 0 — stacked vertically. Detect
  that case and lay the screens out as a row manually.

## Editing without putting callbacks in node data

Node and edge `data` should stay plain serialisable objects so React Flow's memo
comparisons keep working. Pass edit callbacks through a React context
(`FlowCanvasEditContext`) and give each node/edge only the **address** of what it
writes to:

```js
// note node
data.target = { kind: 'screen', flowId: 'global', screenId: 'dashboard' }
// edge
data.transitionIndex = 3
```

The canvas owns the document and applies the mutation, then debounces one PUT to the
dev-server writer. Persist dragged positions as **offsets from the laid-out spot**,
never absolute coordinates — a layout change then moves the note with its card
instead of stranding it.

## Things that break

| Symptom | Cause |
|---|---|
| Label ignores clicks and drags | `zIndex` on the edge (see above) |
| Edges converge on a node's corner | Missing `useUpdateNodeInternals`, or a `sourceHandle` id that doesn't exist |
| Nothing renders, blank canvas | Parent has no explicit height |
| `nodeTypes`/`edgeTypes` warning, laggy pan | Object defined inside the component; hoist to module scope |
| Arrowheads are black | `markerEnd.color` not set |
| Nodes stack at 0,0 | dagre ran before nodes were registered, or edge ids don't match node ids |
| Double-click zooms instead of editing | `zoomOnDoubleClick` left on |
| Screenshot export cuts off | `toPng` must target `.react-flow__viewport`, not the wrapper |
| `var(--token)` comes out transparent in the PNG | html-to-image clones out of the cascade — resolve to a literal colour with `getComputedStyle` first |

## Docs worth opening

- Custom nodes: https://reactflow.dev/learn/customization/custom-nodes
- Handles: https://reactflow.dev/learn/customization/handles
- Custom edges: https://reactflow.dev/learn/customization/custom-edges
- Layouting with dagre: https://reactflow.dev/examples/layout/dagre
- Download image: https://reactflow.dev/examples/misc/download-image
