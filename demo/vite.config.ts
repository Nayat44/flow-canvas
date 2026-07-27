import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { flowCanvasWriter } from '../packages/canvas/vite-plugin-flow-canvas'

// Run from the repo root: npm run demo
export default defineConfig({
  root: __dirname,
  // The writer makes notes editable while the dev server runs. apply: 'serve' inside the
  // plugin keeps it out of builds, so a deployed canvas is read-only.
  plugins: [react(), flowCanvasWriter({ documentPath: 'demo/public/flow-canvas/flows.json' })],
  server: { port: 5173 }
})
