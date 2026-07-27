import { FlowCanvas } from '../../packages/canvas'
import '../../packages/canvas/flow-canvas.css'

/**
 * The demo is deliberately thin: in a real app you'd render <FlowCanvas /> on an
 * internal route inside your own shell.
 */
export const App = () => (
  <main style={{ padding: 24, background: 'var(--fc-canvas, #f4f5f7)', minHeight: '100vh' }}>
    <h1 style={{ font: '600 22px/1.3 system-ui, sans-serif', margin: '0 0 4px' }}>flow-canvas demo</h1>
    <p style={{ font: '14px/1.5 system-ui, sans-serif', color: '#6b7280', margin: '0 0 18px' }}>
      Screens captured from the pretend product in <code>public/fixtures/</code>. Notes and labels are editable —
      the changes land in <code>public/flow-canvas/flows.json</code>.
    </p>
    <FlowCanvas />
  </main>
)
