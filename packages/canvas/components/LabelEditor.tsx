import { FC, FocusEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

interface Props {
  action: string
  condition: string
  onCommit: (next: { action: string; condition: string }) => void
  onCancel: () => void
}

/** Two-line editor for an edge label: the action, then the condition under it. */
export const LabelEditor: FC<Props> = ({ action, condition, onCommit, onCancel }) => {
  const ref = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState({ action, condition })
  const cancelled = useRef(false)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelled.current = true
      onCancel()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      onCommit(values)
    }
  }

  // Committing on blur would fire while tabbing between the two fields, so the
  // editor closes on Enter, Esc, or focus leaving the label entirely.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (cancelled.current) return
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    onCommit(values)
  }

  return (
    <div className="fc-editor" onBlur={handleBlur}>
      <input
        ref={ref}
        value={values.action}
        placeholder="Action, e.g. Click 'Continue'"
        onChange={(event) => setValues((current) => ({ ...current, action: event.target.value }))}
        onKeyDown={handleKeyDown}
        className="nodrag nowheel"
      />
      <input
        value={values.condition}
        placeholder="Condition (optional)"
        onChange={(event) => setValues((current) => ({ ...current, condition: event.target.value }))}
        onKeyDown={handleKeyDown}
        className="nodrag nowheel"
      />
      <span className="fc-editor__hint">↵ save · esc cancel · empty action hides the label</span>
    </div>
  )
}
