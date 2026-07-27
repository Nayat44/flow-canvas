import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react'

interface Props {
  notes: string[]
  onCommit: (notes: string[]) => void
  onCancel: () => void
  rows?: number
}

const toNotes = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** One note per line — fastest thing to type into, and it reorders by editing. */
export const NotesEditor: FC<Props> = ({ notes, onCommit, onCancel, rows = 5 }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(notes.join('\n'))
  // Escape must not also fire the commit that blur would.
  const cancelled = useRef(false)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.setSelectionRange(ref.current.value.length, ref.current.value.length)
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelled.current = true
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onCommit(toNotes(value))
    }
  }

  return (
    <div className="fc-editor">
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (cancelled.current) return
          onCommit(toNotes(value))
        }}
        className="nodrag nowheel"
      />
      <span className="fc-editor__hint">One note per line · ⌘↵ to save · esc to cancel</span>
    </div>
  )
}
