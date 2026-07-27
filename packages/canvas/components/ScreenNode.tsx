import { memo, useEffect, useState } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'

import { ExternalIcon } from '../icons'
import { LIVE_FRAME_HEIGHT, LIVE_FRAME_WIDTH, SCREEN_NODE_WIDTH } from '../constants'
import type { ScreenFlowNode } from '../types'

const LIVE_SCALE = SCREEN_NODE_WIDTH / LIVE_FRAME_WIDTH

const ScreenNodeComponent = ({ id, data, selected }: NodeProps<ScreenFlowNode>) => {
  const updateNodeInternals = useUpdateNodeInternals()
  const hotspots = data.hotspots ?? []
  const isLive = data.showLive && Boolean(data.live)
  // In the all-flows view the frame waits for a click — each one boots the whole
  // preview route, and a dozen at once is a lot of app instances.
  const [frameArmed, setFrameArmed] = useState(false)
  const showFrame = isLive && (data.autoLoadLive || frameArmed)

  useEffect(() => {
    if (!data.showLive) setFrameArmed(false)
  }, [data.showLive])

  // Handles are measured on mount — toggling hotspots or the live frame without a
  // re-measure collapses every edge onto the card's top-left corner.
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, hotspots.length, data.showHotspots, isLive, showFrame, updateNodeInternals])

  const status = data.status ?? 'ready'

  return (
    <div
      className={[
        'fc-screen',
        status !== 'ready' ? `fc-screen--${status}` : '',
        selected ? 'fc-screen--selected' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: SCREEN_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Left} id="in" className="rf-handle-edge" />

      <header className="fc-screen__head">
        <span className="fc-screen__title">{data.title}</span>
        {data.live ? (
          <a
            href={data.live}
            target="_blank"
            rel="noreferrer"
            title={data.liveHint ?? 'Open this state in a new tab'}
            className="fc-screen__live nodrag"
            onClick={(event) => event.stopPropagation()}
          >
            Open live
            <ExternalIcon />
          </a>
        ) : (
          data.route && <span className="fc-screen__route">{data.route}</span>
        )}
      </header>

      <div className="fc-screen__shot" style={{ height: isLive ? LIVE_FRAME_HEIGHT * LIVE_SCALE : undefined }}>
        {isLive ? (
          showFrame ? (
            // nodrag/nowheel hand pointer and scroll events to the embedded app
            // instead of the canvas, so the state is genuinely clickable.
            <iframe
              src={data.live}
              title={`${data.title} — live`}
              className="fc-frame nodrag nowheel"
              style={{ width: LIVE_FRAME_WIDTH, height: LIVE_FRAME_HEIGHT, transform: `scale(${LIVE_SCALE})` }}
            />
          ) : (
            <button
              type="button"
              className="fc-frame-arm nodrag"
              onClick={(event) => {
                event.stopPropagation()
                setFrameArmed(true)
              }}
            >
              <strong>Load live state</strong>
              <span>{data.liveHint ?? 'Runs the real component in this card'}</span>
            </button>
          )
        ) : data.image ? (
          <img src={data.image} alt={data.title} draggable={false} />
        ) : (
          <div className="fc-screen__placeholder">No screenshot</div>
        )}

        {hotspots.map((hotspot, index) => (
          <div
            key={hotspot.id}
            title={hotspot.note ?? hotspot.label}
            // Hidden in live mode, but still mounted: the handle is what anchors the
            // outgoing edge to this control.
            className={`fc-hotspot${data.showHotspots && !isLive ? '' : ' fc-hotspot--hidden'}`}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.w ?? 12}%`,
              height: `${hotspot.h ?? 5}%`
            }}
          >
            <span className="fc-hotspot__index">{index + 1}</span>
            <span className="fc-hotspot__label">{hotspot.label}</span>
            <Handle type="source" position={Position.Right} id={hotspot.id} className="rf-handle-hotspot" />
          </div>
        ))}
      </div>

      {showFrame && data.liveHint && <div className="fc-screen__hint">{data.liveHint}</div>}

      {/* Notes are not repeated here — the sticky note below the card owns them, and
          it is the one you can edit. */}

      <Handle type="source" position={Position.Right} id="out" className="rf-handle-edge" />
    </div>
  )
}

export const ScreenNode = memo(ScreenNodeComponent)
