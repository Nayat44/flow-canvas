---
name: flow-canvas
description: Build an interactive flow canvas — a React Flow map of every screen in a product area, captured from the running app, with arrows anchored to the exact control the user clicks and notes designers edit on the canvas. Use this whenever someone asks for a flow map, screen map, user flow, journey map, click-through map, "overview of all the flows", a handoff doc for a feature, or wants to see how screens connect. Also use it when an existing canvas needs new screens or re-captured screenshots after a UI change.
---

# Flow Canvas

Turns a product area into a browsable map that lives **inside the app it documents**.
Three properties make it worth the effort, and all three are load-bearing:

1. **Whole screens, entry points included.** A cropped modal is not a flow. Every node
   is a full-page capture — nav bar, page behind the dimmed overlay — so a reader sees
   *where* the user was when that modal opened.
2. **Arrows leave the control, not the card.** Each click target is a hotspot box over
   the screenshot holding its own React Flow handle, so the arrow starts on the button,
   not on the edge of the card.
3. **Screenshots come from the running app, on demand.** A capture script re-shoots
   every screen from the dev server, so the map can't drift far from the code. If you
   are looking at screenshots someone committed weeks ago, assume they lie.

A working implementation lives in the flow-canvas repo at `packages/canvas/` — copy it
into the app you're documenting. It has no design system and no router dependency: one
stylesheet with CSS variables, inline icons, `@xyflow/react` + `@dagrejs/dagre` +
`html-to-image`. If the repo isn't cloned locally, fetch it:

    https://github.com/Nayat44/flow-canvas

Paths below are relative to this skill folder (`references/`, `scripts/`) or to the repo
(`packages/`, `demo/`, `examples/`).

## Workflow

### 1. Establish what the UI actually does — from the code, not the docs

Read the component that owns the flow and list its real states. Plans, handoff
documents and old screenshots go stale within days; the code doesn't.

For every state you intend to draw, check:

- **Is there a control that reaches it?** Grep for the handler. A prop that is received
  and never called (`onSubmit: _onSubmit`) means the state is unreachable — say so in a
  note instead of drawing a transition into it.
- **Is the component even mounted?** A component with no importer is dead code.
- **Which entry points open the flow, and what does each one open *on*?**

When code and a plan document disagree, the code wins and the discrepancy earns a note
on the canvas. That contradiction is usually the most valuable thing on the map.

### 2. Make the screens capturable without a login

Real pages need auth, tenant context and live data. Rather than asking anyone for a
session, mount the **real page components over mocked contexts** in a dev-only route.
See `references/capture-harness.md`, and `examples/screens-preview.example.tsx` in the repo.

The harness route takes query params for every state worth capturing:

```
/dev/screens?page=<page>
/dev/screens?page=<page>&modal=<modal>&id=<record>
/dev/screens?page=<page>&state=loading|error
/dev/screens/<nested>/:id     ← for pages that read route params
```

### 3. Capture every screen

`scripts/capture-screens.mjs` (in this skill folder) drives headless Chrome over CDP: navigate, optionally
click through to a state that has no URL of its own, screenshot at 1440×950 @2x. Node
22's global `WebSocket` means no puppeteer dependency. Point it at a shots config — copy `demo/flow-canvas.shots.mjs` from the repo and repoint the URLs.

Rules that matter:

- **Scope in-modal clicks to `[role="dialog"]`.** The page behind usually has
  same-labelled buttons, and an unscoped `querySelectorAll('button')` grabs the wrong one.
- **Grant clipboard permission** (`Browser.grantPermissions`) for "copied" states;
  without it you capture the failure toast.
- **Assert every click landed.** Return `'miss'` and log it — a missed click silently
  captures the previous state, which then quietly lies on the canvas.

### 4. Write flows.json

`references/flows-schema.md` has every field. The shape:

```
project → flows[] → { stages[], screens[] → hotspots[], transitions[] }
```

Each flow becomes a lane with a band header, laid out left-to-right by dagre. Put the
primary journey first. **Group by entry point, not by component** — "Global entry
point", "Detail page", "History", then a catalogue lane for edge cases and states.

**Placing hotspots.** `x/y/w/h` are percentages of the screenshot from its top-left.
Read the image, measure the control, divide by the image dimensions, round to whole
numbers. A box slightly larger than the control reads better than one slightly smaller.
Then look at the rendered canvas and nudge.

**Only mark real controls.** Before adding a hotspot, confirm the element has a
handler. Marking a label as a click target is the single most misleading thing this
document can do: a pill that describes an action is not a button.

**Transitions** carry the action in the user's words (`Click 'Continue'`) with the
condition underneath (`if the account is verified`). `variant` drives colour: `primary`
(happy path, animated), `alt`, `error`, `back`.

**Notes are for what the picture can't show:** conditions, what isn't wired up yet,
open questions for the PM. Never narrate the screenshot — a note reading "this is the
list page" wastes the reader's attention.

### 5. Verify before handing over

```bash
python3 scripts/validate.py <app>/public/flow-canvas/flows.json
```

Then **look at it** — screenshot the canvas headlessly, one lane at a time, and read
the result. Overlapping notes, colliding ranks and labels sitting on screenshots are
invisible in a diff and obvious in an image.

## Editing on the canvas

Designers own the notes, so the notes are editable in place: double-click a sticky (or
the pencil), one note per line, ⌘↵ to save, hover for an × to delete. Edge labels drag
to move, double-click to edit, × to clear the label while keeping the arrow. Stickies
and labels remember where they're dropped, stored as offsets from the laid-out spot.

Writes go through the **dev-only vite plugin** (`vite-plugin-flow-canvas.ts` in the canvas package)
which PUTs the document back to `flows.json` — so an edit lands in `git diff` and
travels with the branch. Deployed builds have no writer, so the canvas is read-only
there; that is deliberate, and the toolbar says so.

## Gotchas that cost real time

Read `references/react-flow-patterns.md` before touching the components.

| Symptom | Cause |
|---|---|
| Edge labels ignore every click and drag | An edge with `zIndex` set lifts the edge SVG above React Flow's label renderer; the path swallows the pointer events |
| Arrows converge on a card's top-left corner | Missing `useUpdateNodeInternals` after hotspots change, or a `fromHotspot` id that doesn't exist |
| Blank canvas | The React Flow parent has no explicit height |
| Layout shifts on every reload | Node sizes measured instead of fixed |
| Notes overlapping the card below | The dagre rank height has to cover the card *and* its sticky note |
| A JS `.click()` test passes but real clicking doesn't | `.click()` bypasses hit-testing — verify pointer interactions with CDP `Input.dispatchMouseEvent` |
| Exported PNG has a transparent background | html-to-image clones out of the cascade; resolve `var(--token)` to a literal with `getComputedStyle` first |

## When the default shape isn't right

- **A lane with no transitions** is a catalogue, not a journey — lay it out as a plain
  row. dagre would otherwise stack every screen in one rank.
- **Comparing current vs. proposed** — two lanes with matching screen order.
- **No screenshots yet** — build it from route names; nodes fall back to a placeholder
  and images drop in later without touching the structure.
- **A state that isn't in the prototype** — don't draw it. Note the discrepancy on the
  nearest screen, and remove its capture entry so a re-capture doesn't resurrect it.
