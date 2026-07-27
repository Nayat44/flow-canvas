# flow-canvas

A flow map that lives inside the app it documents: whole screens with their entry
points, arrows anchored to the exact control the user clicks, and notes designers edit
on the canvas.

Built as a **Claude Code skill** plus a portable React implementation, so a designer can
ask Claude to map a feature and get the same result every time.

![A lane of the demo canvas: three whole screens, arrows leaving the buttons that cause
them, notes under each card](docs/canvas.png)

## Why this exists

Most teams keep the flow overview in Figma: export the screens, arrange them on a board,
draw connectors between them, annotate. It's the artifact everyone opens to answer "what
happens when I click this?"

The trouble is what that board actually is — **a copy of the product, made by hand.**

- It's stale the moment someone ships a change, and nothing tells you it's stale.
- Keeping it current is manual work nobody has time for: re-export, re-place, re-draw.
- The connectors point at boxes, not at buttons. "This screen leads to that screen" —
  but from *which* control, under *which* condition?
- The overview and the prototype are two different files. The board is readable but
  dead; the prototype is clickable but you can't see the shape of the whole flow. You
  end up maintaining both, and they disagree.
- Nothing on that board is the real thing. It's a picture of a build, one commit behind
  at best.

**The end goal here is one artifact where the overview and the prototype are the same
thing, and neither is hand-made.**

- The **overview** is generated from the running app. One command re-shoots every
  screen, so it's a snapshot of what's actually built — not a redrawing of it.
- The **arrows** leave the exact control that causes the navigation, with the action and
  the condition written on them. No ambiguity about which button goes where.
- The **prototype** is right there: every card links to that state running for real, and
  "Live screens" embeds the real, clickable component inside the card. Read the shape of
  the flow and click through it in the same view.
- The **annotations** live next to the screens, are edited by designers on the canvas,
  and are written back to a JSON file in the repo — so they review like code and travel
  with the branch instead of rotting on a board nobody opened.

What that removes: no exporting screens to Figma, no redrawing connectors after every
change, no "which board is current?", no separate prototype file to keep in sync, and no
meeting to explain what connects to what.

**Where Figma is still the right tool:** designing what doesn't exist yet. Exploration,
visual craft, options nobody has built. This is for the other half of the job —
documenting what *is* built, or half-built, and making the gaps between design and code
impossible to miss. In practice you draw in Figma and document here, and the two stop
competing to be the source of truth.

## What makes it different from a boxes-and-arrows diagram

- **Whole screens, entry points included.** Every node is a full-page capture — nav bar,
  page behind the dimmed overlay — not a cropped modal.
- **Arrows leave the control.** Each click target is a hotspot box holding its own React
  Flow handle, so the arrow starts on the button rather than the edge of the card.
- **Screenshots come from the running app.** A capture script re-shoots every screen
  from the dev server over CDP, so the map can't quietly go stale.
- **Notes are the deliverable, and designers own them.** Edit on the canvas; the change
  is written back to `flows.json` and shows up in `git diff`.
- **Every card links to the state running for real**, and can embed it live in the card.

## See it working first

```bash
git clone https://github.com/Nayat44/flow-canvas.git
cd flow-canvas
npm install
npm run demo          # http://localhost:5173
```

That's a real canvas of a pretend product ("Acme records"), captured from the fixture
pages in `demo/public/fixtures/`. Everything works: filter a lane, toggle click targets,
edit a note, drag a label, export a PNG. Re-shoot the screens with `npm run demo:capture`
and watch the map follow the fixtures.

`demo/public/flow-canvas/flows.json` is the worked example to copy from —
`references/flows-schema.md` explains every field in it.

## Install the skill

```bash
git clone https://github.com/Nayat44/flow-canvas.git
cd flow-canvas && ./install.sh          # copies skills/* into ~/.claude/skills/
```

`skills/` holds each skill in exactly the shape Claude Code expects, so you can also
copy-paste it straight in — no build step, nothing to configure:

```bash
cp -r skills/flow-canvas ~/.claude/skills/          # every project
cp -r skills/flow-canvas <your-repo>/.claude/skills/ # or just one, versioned with the code
```

Then, in your product repo:

> Use the flow-canvas skill. Map the **\<feature\>** flow: whole screens with their
> entry points, arrows on the exact controls, captured from the current code.

Designers: read [`skills/flow-canvas/references/designer-playbook.md`](skills/flow-canvas/references/designer-playbook.md) —
it has the prompts, what to push back on, and how to annotate.

## What's in here

```
install.sh                            copies skills/* into ~/.claude/skills/
skills/flow-canvas/                   ← copy-paste this into ~/.claude/skills/
  SKILL.md                            the skill Claude loads — workflow and gotchas
  references/designer-playbook.md     for designers: prompts, review, annotation, handoff
  references/flows-schema.md          every field in flows.json
  references/react-flow-patterns.md   implementation patterns and the traps
  references/capture-harness.md       how screenshots get taken without a login
  scripts/validate.py                 checks a flows.json before you open the browser
  scripts/capture-screens.mjs         re-captures every screen over CDP
  scripts/click-helpers.mjs           click steps for states with no URL
packages/canvas/                      the canvas — copy this into your app
demo/                                 runnable demo: npm run demo
  public/fixtures/                    a pretend product to capture
  public/flow-canvas/flows.json       a real document to copy from
  flow-canvas.shots.mjs               a real capture config to copy from
examples/screens-preview.example.tsx  the dev harness pattern for a real app
```

## Adding the canvas to an app

Requires React 18+, Vite, and:

```bash
npm i @xyflow/react @dagrejs/dagre html-to-image
```

1. Copy `packages/canvas/` into your app (e.g. `src/modules/flow-canvas/`).
2. Route it wherever it belongs, behind whatever flag you use for internal tooling:
   ```tsx
   import { FlowCanvas } from './modules/flow-canvas'
   // <Route path="/flows" element={<FlowCanvas />} />
   ```
3. Register the writer plugin so notes are editable in dev:
   ```ts
   import { flowCanvasWriter } from './src/modules/flow-canvas/vite-plugin-flow-canvas'
   export default defineConfig({ plugins: [react(), flowCanvasWriter()] })
   ```
4. Put your document at `public/flow-canvas/flows.json` and screenshots in
   `public/flow-canvas/screens/`. Start from `demo/public/flow-canvas/flows.json`.
5. Capture the screens: copy `demo/flow-canvas.shots.mjs`, point the URLs at your app
   (ideally a `/dev/screens` harness — see `references/capture-harness.md`), then
   ```bash
   node skills/flow-canvas/scripts/capture-screens.mjs flow-canvas.shots.mjs
   ```

It ships its own stylesheet — no Tailwind, no design system. Restyle by overriding the
CSS variables on `.flow-canvas`:

```css
.flow-canvas {
  --fc-primary: #6b4ff2;
  --fc-surface: #fff;
  --fc-font: 'Inter', sans-serif;
}
```

Light and dark both come out of the box via `prefers-color-scheme`.

`useViewOptions` keeps the lane filter and live-mode flag in the URL through the History
API, so it works with any router — swap its body for `useSearchParams` if you'd rather
your router owned it.

## Controls

| | |
|---|---|
| Flow dropdown | Isolates one lane; reflected as `?flow=<id>` so you can link it |
| Click targets | Hides the hotspot overlays for a clean screenshot |
| Live screens | Swaps each screenshot for the state running for real, embedded and clickable (`?live=1`) |
| Export PNG | Renders the current viewport for a ticket or a deck |
| Double-click a sticky | Edit notes, one per line, ⌘↵ to save |
| Hover a note → × | Delete that note |
| Drag a sticky or a label | Position is remembered as an offset from the laid-out spot |
| Double-click a label | Edit the action and condition |

## Licence

MIT — see [LICENSE](LICENSE).
