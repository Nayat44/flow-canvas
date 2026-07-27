import { FC, useState } from 'react'

import { CloseIcon, ExternalIcon, PencilIcon } from '../icons'
import { useFlowCanvasEdit } from '../edit-context'
import { NotesEditor } from './NotesEditor'
import { DeleteNoteButton } from './DeleteNoteButton'
import type { ScreenNodeData } from '../types'

interface Props {
  screen: ScreenNodeData
  onClose: () => void
}

export const ScreenInspector: FC<Props> = ({ screen, onClose }) => {
  const { canEdit, setNotes, removeNote } = useFlowCanvasEdit()
  const [editing, setEditing] = useState(false)
  const notes = screen.notes ?? []
  const target = { kind: 'screen' as const, flowId: screen.flowId, screenId: screen.id }

  return (
    <aside className="fc-inspector">
      <div className="fc-inspector__section-head">
        <div>
          <h2>{screen.title}</h2>
          <div className="fc-inspector__meta">
            {screen.flowName}
            {screen.route ? ` · ${screen.route}` : ''}
          </div>
        </div>
        <button type="button" aria-label="Close inspector" className="fc-icon-button" onClick={onClose}>
          <CloseIcon width={14} height={14} />
        </button>
      </div>

      {screen.description && <p style={{ margin: 0 }}>{screen.description}</p>}

      {screen.live && (
        <div className="fc-inspector__section">
          <a href={screen.live} target="_blank" rel="noreferrer" className="fc-inspector__link">
            Open this state live <ExternalIcon />
          </a>
          {screen.liveHint && <span className="fc-inspector__meta">{screen.liveHint}</span>}
        </div>
      )}

      {screen.hotspots?.length ? (
        <section className="fc-inspector__section">
          <h3>Click targets</h3>
          <ol style={{ listStyle: 'none', paddingLeft: 0 }}>
            {screen.hotspots.map((hotspot, index) => (
              <li key={hotspot.id} className="fc-hotspot-ref">
                <span className="fc-hotspot-ref__index">{index + 1}</span>
                <div>
                  <strong>{hotspot.label}</strong>
                  {hotspot.note && <div className="fc-inspector__meta">{hotspot.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {(notes.length > 0 || canEdit) && (
        <section className="fc-inspector__section">
          <div className="fc-inspector__section-head">
            <h3>Notes</h3>
            {canEdit && !editing && (
              <button type="button" className="fc-icon-button" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <NotesEditor
              notes={notes}
              rows={Math.max(5, notes.length + 1)}
              onCommit={(next) => {
                setNotes(target, next)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : notes.length ? (
            <ul>
              {notes.map((note, index) => (
                <li key={note}>
                  <div className="fc-note__item">
                    <span>{note}</span>
                    {canEdit && <DeleteNoteButton note={note} onDelete={() => removeNote(target, index)} />}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <span className="fc-inspector__meta">No notes yet.</span>
          )}
        </section>
      )}
    </aside>
  )
}
