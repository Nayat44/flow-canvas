import { FC } from 'react'

import { CloseIcon } from '../icons'

interface Props {
  onDelete: () => void
  /** Note text, so the label says which one is going. */
  note: string
}

/** Hover-revealed × that drops one note. Focusable, so it works from the keyboard. */
export const DeleteNoteButton: FC<Props> = ({ onDelete, note }) => (
  <button
    type="button"
    aria-label={`Delete note: ${note}`}
    title="Delete note"
    className="fc-icon-button fc-icon-button--danger nodrag"
    onClick={(event) => {
      event.stopPropagation()
      onDelete()
    }}
  >
    <CloseIcon />
  </button>
)
