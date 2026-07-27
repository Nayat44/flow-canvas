import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from '@xyflow/react'

import { CloseIcon } from '../icons'
import { useFlowCanvasEdit } from '../edit-context'
import { LabelEditor } from './LabelEditor'
import type { CanvasEdge } from '../types'

/** Edge that spells out the interaction: what the user clicks, and any condition. */
export const ActionEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data
}: EdgeProps<CanvasEdge>) => {
  const { canEdit, setLabel, setLabelOffset } = useFlowCanvasEdit()
  const { getZoom } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12
  })

  const target = useMemo(
    () => (data ? { flowId: data.flowId, transitionIndex: data.transitionIndex } : null),
    [data]
  )
  const stored = data?.labelOffset ?? { x: 0, y: 0 }
  const offset = drag ?? stored

  // Window listeners rather than pointer capture: capture needs a real pointerId,
  // and the pointer regularly leaves a label this small mid-drag.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canEdit || !target || editing) return
    event.stopPropagation()
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, x: stored.x, y: stored.y }
    setDrag(stored)
  }

  const commitDrag = useCallback(
    (next: { x: number; y: number } | null) => {
      const origin = dragOrigin.current
      dragOrigin.current = null
      if (!origin || !target || !next) return
      const moved = Math.abs(next.x - origin.x) > 1 || Math.abs(next.y - origin.y) > 1
      if (moved) setLabelOffset(target, { x: Math.round(next.x), y: Math.round(next.y) })
      else setDrag(null)
    },
    [target, setLabelOffset]
  )

  useEffect(() => {
    if (!drag) return

    const handleMove = (event: PointerEvent | MouseEvent) => {
      const origin = dragOrigin.current
      if (!origin) return
      // Pointer deltas are screen pixels; the label lives in canvas units.
      const zoom = getZoom() || 1
      setDrag({
        x: origin.x + (event.clientX - origin.pointerX) / zoom,
        y: origin.y + (event.clientY - origin.pointerY) / zoom
      })
    }
    const handleUp = () => setDrag((current) => (commitDrag(current), current))

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [drag, getZoom, commitDrag])

  const hasLabel = Boolean(data?.action || data?.condition)
  if (!hasLabel && !editing) {
    return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className={[
            'fc-edge-label',
            `fc-edge-label--${data?.variant ?? 'primary'}`,
            canEdit && !editing ? 'fc-edge-label--draggable' : '',
            dragOrigin.current ? 'fc-edge-label--dragging' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ transform: `translate(-50%, -50%) translate(${labelX + offset.x}px, ${labelY + offset.y}px)` }}
          onPointerDown={onPointerDown}
          onMouseDown={(event) => event.stopPropagation()}
          onDoubleClick={(event) => {
            if (!canEdit) return
            event.stopPropagation()
            setEditing(true)
          }}
        >
          {editing && target ? (
            <LabelEditor
              action={data?.action ?? ''}
              condition={data?.condition ?? ''}
              onCommit={(next) => {
                setLabel(target, next)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="fc-note__item">
                <span className="fc-edge-label__action">{data?.action}</span>
                {canEdit && target && (
                  <button
                    type="button"
                    aria-label="Remove label"
                    title="Remove label — the arrow stays"
                    className="fc-icon-button fc-icon-button--danger nodrag"
                    onClick={(event) => {
                      event.stopPropagation()
                      setLabel(target, { action: '', condition: '' })
                    }}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              {data?.condition && <span className="fc-edge-label__condition">if {data.condition}</span>}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
