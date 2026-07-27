import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import { PencilIcon } from '../icons'
import { useFlowCanvasEdit } from '../edit-context'
import { NotesEditor } from './NotesEditor'
import { DeleteNoteButton } from './DeleteNoteButton'
import type { NoteFlowNode } from '../types'

const NoteNodeComponent = ({ data }: NodeProps<NoteFlowNode>) => {
  const { canEdit, setNotes, removeNote } = useFlowCanvasEdit()
  const [editing, setEditing] = useState(false)

  return (
    <div
      className={`fc-note fc-note--${data.tone}`}
      onDoubleClick={() => canEdit && setEditing(true)}
    >
      <Handle type="target" position={Position.Top} id="in" className="rf-handle-edge" />

      <div className="fc-note__head">
        <span className="fc-note__title">{data.title}</span>
        {canEdit && !editing && (
          <button
            type="button"
            aria-label="Edit notes"
            title="Edit notes"
            className="fc-icon-button nodrag"
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {editing ? (
        <NotesEditor
          notes={data.items}
          rows={Math.max(4, data.items.length + 1)}
          onCommit={(notes) => {
            setNotes(data.target, notes)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : data.items.length ? (
        data.items.map((item, index) => (
          <div key={item} className="fc-note__item">
            <span>{item}</span>
            {canEdit && <DeleteNoteButton note={item} onDelete={() => removeNote(data.target, index)} />}
          </div>
        ))
      ) : (
        <span className="fc-note__empty">{canEdit ? 'Double-click to add a note' : 'No notes'}</span>
      )}
    </div>
  )
}

export const NoteNode = memo(NoteNodeComponent)
