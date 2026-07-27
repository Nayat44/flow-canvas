// Re-captures every screen listed in a shots config, from the running dev server,
// so a flow canvas never drifts from the code.
//
//   node scripts/capture-screens.mjs [config.mjs] [out-dir]
//
// The config default-exports { baseUrl, width, height, shots }. See
// examples/shots.example.mjs. Screens normally come from a /dev/screens harness that
// renders the real pages over mocked contexts (references/capture-harness.md).

import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
// Helpers live in click-helpers.mjs so a shots config can import the same ones.

const CONFIG_PATH = process.argv[2] ?? 'flow-canvas.shots.mjs'
const config = (await import(pathToFileURL(path.resolve(CONFIG_PATH)).href)).default

const OUT = path.resolve(process.argv[3] ?? config.outDir ?? 'public/flow-canvas/screens')
const BASE = config.baseUrl ?? 'http://localhost:5173'
const PORT = config.debugPort ?? 9333
const CHROME = config.chrome ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const WIDTH = config.width ?? 1440
const HEIGHT = config.height ?? 950
const SHOTS = config.shots ?? []

mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  `--user-data-dir=${tmpdir()}/flow-screens-chrome`,
  'about:blank'
], { stdio: 'ignore' })

process.on('exit', () => chrome.kill())

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const json = await res.json()
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(500)
  }
  throw new Error('Chrome did not expose a debugger socket')
}

const ws = new WebSocket(await wsUrl())
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
let sessionId = null

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})

function send(method, params = {}, useSession = true) {
  const id = nextId++
  const payload = { id, method, params }
  if (useSession && sessionId) payload.sessionId = sessionId
  ws.send(JSON.stringify(payload))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

// One tab, reused for every capture.
const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, false)
const attached = await send('Target.attachToTarget', { targetId, flatten: true }, false)
sessionId = attached.sessionId
await send('Page.enable')
await send('Runtime.enable')
await send('Browser.grantPermissions', {
  origin: BASE,
  permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite']
}, false).catch(() => {})
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 2,
  mobile: false
})

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  return res.result?.value
}

async function shoot(name, { url, steps = [], settle = 2600 }) {
  if (url) {
    await send('Page.navigate', { url: `${BASE}${url}` })
    await sleep(settle)
  }
  for (const step of steps) {
    const result = await evaluate(step)
    if (result === 'miss') console.warn(`  ! step missed on ${name}: ${step.slice(0, 70)}…`)
    await sleep(900)
  }
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: false })
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(data, 'base64'))
  console.log(`✓ ${name}`)
}

let failed = 0
for (const shot of SHOTS) {
  const { name, ...spec } = shot
  try {
    await shoot(name, spec)
  } catch (error) {
    failed += 1
    console.error(`✗ ${name}: ${error.message}`)
  }
}

ws.close()
chrome.kill()
console.log(failed ? `done with ${failed} failure(s)` : 'done')
process.exit(failed ? 1 : 0)
