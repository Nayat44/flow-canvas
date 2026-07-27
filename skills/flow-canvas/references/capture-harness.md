# Capturing whole screens without a login

The problem: full-page screenshots need a session, tenant context and live data. Asking
a designer to log in and screenshot by hand produces images that are stale a week later
and inconsistent in size.

The solution: a dev-only route that mounts the **real page components** over mocked
contexts, plus a script that drives headless Chrome over it.

Worked example: `examples/screens-preview.example.tsx` and `scripts/capture-screens.mjs`.

## 1. The harness route

Gate it on `import.meta.env.DEV` so it's tree-shaken from production:

```tsx
...(import.meta.env.DEV
  ? [{ path: '/dev/screens', lazy: async () => ({ Component: (await import('./dev/ScreensPreview')).ScreensPreview }) }]
  : [])
```

### What to mock

Provide the contexts the real components read, with fixture data — not a mocked GraphQL
client with hand-written documents, which is brittle and breaks whenever a query
changes:

- **auth / user / tenant contexts** — the nav bar usually needs all of them
- **the feature's own context**, populated from the same fixtures the feature's mock
  data layer already uses
- **presentational components** that take props can simply be handed an array

Providers that live above the router (wallet, query client, theme) usually come free: a
`/dev/*` route inside the same provider tree already has them.

Cast fixtures with `as unknown as ContextType`. Reproducing a deeply-nested query shape
exactly is wasted work — only the fields the components read matter.

### Traps

- **Detail pages read route params.** A page that looks up its record from `:id` will
  redirect when the id isn't on the path — and the redirect usually lands on the login
  page, which is what you'll capture. Register a second route with the params in the path.
- **A permission-gated modal host won't render.** If the host checks
  `hasPermission(...)`, it returns null without a session. Render the flow component
  inside a plain `<Modal open>` rather than going through the host.
- **Use the same ids as the feature's mock data.** Then a row on the list and the modal
  it opens describe the same record, and the map is coherent.
- **Fixed timestamps in fixtures.** Random or `Date.now()`-derived values make every
  re-capture a diff.

## 2. The capture script

Node 22 ships a global `WebSocket`, so CDP needs no dependencies:

```js
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, ...])
const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
const ws = new WebSocket(webSocketDebuggerUrl)
// Target.createTarget → Target.attachToTarget → Page.enable → Runtime.enable
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 2 })
```

Then per shot: `Page.navigate`, settle, optional `Runtime.evaluate` clicks,
`Page.captureScreenshot`.

A shot is a name, a URL, and optionally a list of click steps:

```js
{ name: '05-confirm', url: '/dev/screens?page=list&modal=confirm' }
{ name: '06-blocked', url: '/dev/screens?page=list&modal=confirm',
  steps: [clickInDialog(b => /Continue/.test(b.textContent))] }
```

### Rules

- **Scope in-modal clicks to the dialog:**
  ```js
  const root = document.querySelector('[role="dialog"]') ?? document
  ```
- **Report missed clicks.** Return `'miss'` from the evaluate and log it.
- **Grant clipboard permission** for "copied" states:
  `Browser.grantPermissions({ origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] })`.
  Without it you capture the copy-failure toast — which is itself worth a shot.
- **`Input.dispatchMouseEvent` for anything you're testing interactively.** A JS
  `.click()` bypasses hit-testing, so it will happily pass on an element no real user
  can reach.
- Reuse one tab for every shot; `deviceScaleFactor: 2` keeps cards crisp at canvas zoom.

## 3. Writing the document from the browser

`packages/canvas/vite-plugin-flow-canvas.ts` accepts a PUT and writes `flows.json`:

```ts
import { flowCanvasWriter } from './src/modules/flow-canvas/vite-plugin-flow-canvas'

export default defineConfig({
  plugins: [react(), flowCanvasWriter({ documentPath: 'public/flow-canvas/flows.json' })]
})
```

`apply: 'serve'` keeps it out of builds. It parses the payload before writing so a
malformed body can't corrupt the file, and the client debounces (~600ms) so typing
doesn't produce a write per keystroke.

## 4. Reviewing your own work

Screenshot the canvas itself, headlessly, once per lane, and *look* at it:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --window-size=2200,1300 --virtual-time-budget=20000 \
  --screenshot=lane.png --user-data-dir=/tmp/fc-profile \
  "http://localhost:5173/dev/flow-canvas?flow=<lane-id>"
```

Empty lanes, overlapping notes, colliding ranks and labels on top of screenshots are
unmissable in the image and invisible in the diff.
