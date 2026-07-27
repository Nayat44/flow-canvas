// Shots config for scripts/capture-screens.mjs.
//   node scripts/capture-screens.mjs examples/shots.example.mjs public/flow-canvas/screens
//
// Every `name` here should match an `image` in flows.json: screens/<name>.jpg

import { clickInDialog, clickNthInDialog } from '../scripts/click-helpers.mjs'

const RECORD = 'rec_123'          // an id your mock data layer knows about
const SECOND_RECORD = 'rec_456'

export default {
  baseUrl: 'http://localhost:5173',
  outDir: 'public/flow-canvas/screens',
  width: 1440,
  height: 950,

  shots: [
    // --- Global entry point: the list page and the modal over it ---
    { name: '01-list', url: '/dev/screens?page=list' },
    { name: '02-modal-empty', url: '/dev/screens?page=list&modal=create' },
    { name: '03-modal-filled', url: `/dev/screens?page=list&modal=create&id=${RECORD}` },
    {
      // A state with no URL of its own: click through to it, and the helper warns if
      // the control isn't there any more.
      name: '04-confirm',
      url: `/dev/screens?page=list&modal=create&id=${RECORD}`,
      steps: [clickInDialog('(el) => /Continue/.test(el.textContent ?? "")')]
    },
    {
      name: '05-second-row',
      url: '/dev/screens?page=list&modal=create',
      steps: [clickNthInDialog('Select', 1)]
    },

    // --- Detail page entry point ---
    { name: '20-detail', url: `/dev/screens/records/${SECOND_RECORD}` },
    { name: '21-detail-modal', url: `/dev/screens/records/${SECOND_RECORD}?modal=create&id=${SECOND_RECORD}` },

    // --- States ---
    { name: '30-loading', url: '/dev/screens?page=list&modal=create&state=loading' },
    { name: '31-empty', url: '/dev/screens?page=list&state=empty' }
  ]
}
