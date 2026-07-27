import { FC } from 'react'

import { DownloadIcon } from '../icons'
import { ALL_FLOWS } from '../constants'
import type { SaveState } from '../hooks/useFlowsDoc'
import type { Lane } from '../types'

const SAVE_LABEL: Record<SaveState, string> = {
  idle: 'Notes are editable',
  saving: 'Saving notes…',
  saved: 'Notes saved to flows.json',
  error: 'Could not save notes',
  'read-only': 'Notes are read-only here'
}

interface Props {
  project: string
  version?: string
  lanes: Lane[]
  activeFlow: string
  onActiveFlowChange: (next: string) => void
  showHotspots: boolean
  onShowHotspotsChange: (next: boolean) => void
  showNotes: boolean
  onShowNotesChange: (next: boolean) => void
  showLive: boolean
  onShowLiveChange: (next: boolean) => void
  onExportPng: () => void
  saveState: SaveState
  saveError: string | null
}

export const FlowToolbar: FC<Props> = ({
  project,
  version,
  lanes,
  activeFlow,
  onActiveFlowChange,
  showHotspots,
  onShowHotspotsChange,
  showNotes,
  onShowNotesChange,
  showLive,
  onShowLiveChange,
  onExportPng,
  saveState,
  saveError
}) => (
  <div className="fc-toolbar">
    <div className="fc-toolbar__title">
      <strong>{project} — flows</strong>
      {version && <span>Snapshot {version}</span>}
    </div>

    <select value={activeFlow} onChange={(event) => onActiveFlowChange(event.target.value)}>
      <option value={ALL_FLOWS}>All flows ({lanes.length})</option>
      {lanes.map((lane) => (
        <option key={lane.id} value={lane.id}>
          {lane.name} · {lane.screenCount} screens
        </option>
      ))}
    </select>

    <label className="fc-toggle">
      <input type="checkbox" checked={showHotspots} onChange={(event) => onShowHotspotsChange(event.target.checked)} />
      Click targets
    </label>

    <label className="fc-toggle">
      <input type="checkbox" checked={showNotes} onChange={(event) => onShowNotesChange(event.target.checked)} />
      Notes
    </label>

    <label className="fc-toggle">
      <input type="checkbox" checked={showLive} onChange={(event) => onShowLiveChange(event.target.checked)} />
      Live screens
    </label>

    <div className={`fc-save fc-save--${saveState}`} title={saveError ?? undefined}>
      <i className="fc-save__dot" />
      {SAVE_LABEL[saveState]}
    </div>

    <button type="button" onClick={onExportPng}>
      <DownloadIcon /> Export PNG
    </button>
  </div>
)
