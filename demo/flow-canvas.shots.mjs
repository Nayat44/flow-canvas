// Shots for the demo. In a real app these URLs point at a /dev/screens harness that
// renders your actual pages over mocked contexts — see references/capture-harness.md.
// Here they point at static fixture pages so the demo is self-contained.

export default {
  baseUrl: 'http://localhost:5173',
  outDir: 'public/flow-canvas/screens',
  width: 1440,
  height: 950,
  shots: [
    { name: '01-list', url: '/fixtures/list.html' },
    { name: '02-modal-empty', url: '/fixtures/modal-empty.html' },
    { name: '03-modal-confirm', url: '/fixtures/modal-confirm.html' },
    { name: '20-detail', url: '/fixtures/detail.html' },
    { name: '21-detail-modal', url: '/fixtures/detail-modal.html' },
    { name: '30-loading', url: '/fixtures/loading.html' },
    { name: '31-empty', url: '/fixtures/empty.html' }
  ]
}
