import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'

type Options = {
  /** Absolute or project-relative path to the document. */
  documentPath?: string
  /** Endpoint the canvas PUTs to. Must match FLOW_CANVAS_SAVE_URL in constants.ts. */
  endpoint?: string
}

/**
 * Lets the flow canvas write notes back to flows.json while the dev server runs.
 * `apply: 'serve'` keeps it out of builds, so a deployed canvas is read-only.
 */
export function flowCanvasWriter(options: Options = {}): Plugin {
  const endpoint = options.endpoint ?? '/__flow-canvas/flows.json'
  const documentPath = path.resolve(options.documentPath ?? 'public/flow-canvas/flows.json')

  return {
    name: 'flow-canvas-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(endpoint, (req, res, next) => {
        if (req.method !== 'PUT') return next()

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8')
            // Parse before writing so a malformed payload can't corrupt the file.
            const doc = JSON.parse(body)
            if (!Array.isArray(doc?.flows)) throw new Error('payload is not a flows document')
            await writeFile(documentPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
            res.statusCode = 204
            res.end()
          } catch (error) {
            res.statusCode = 400
            res.end(error instanceof Error ? error.message : 'could not write flows.json')
          }
        })
      })
    }
  }
}
