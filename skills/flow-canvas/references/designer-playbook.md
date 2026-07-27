# Flow canvas — designer playbook

Drop it into your existing app or prototype and get a full overview of all your flows — screens, arrow connectors and the working prototype in one place, generated from the running app instead of redrawn in Figma.

For designers who want that without writing any of it: you give Claude the feature, it
gives you a canvas inside the app, and you edit the notes yourself.

## Once, per machine

Install the skill so every Claude Code session can see it:

```bash
git clone https://github.com/Nayat44/flow-canvas.git
cd flow-canvas && ./install.sh          # copies skills/* into ~/.claude/skills/
```

Or by hand — the folders under `skills/` are already in the shape Claude expects:

```bash
cp -r skills/flow-canvas ~/.claude/skills/
```

Then work in your product repo as usual, with the dev server running — the canvas is
part of the app, not a separate tool.

## Mapping a feature

Say this to Claude, inside the repo:

> Use the flow-canvas skill. Map the **\<feature\>** flow: whole screens with their
> entry points, arrows on the exact controls, captured from the current code. Put the
> canvas in the app so I can review it.

Claude will read the components, build a capture harness for the pages your feature
touches, shoot the screens, write `flows.json`, and show you a screenshot of the result.
Expect one or two rounds of correction — that part is normal and cheap.

What to push back on, because these are the mistakes worth catching:

| You see | Say |
|---|---|
| A cropped modal with no context | "Show the entry point too — I want the whole screen" |
| A screen your prototype doesn't have | "We don't have that screen" |
| An arrow from something that isn't a button | "That's not a CTA" |
| Screenshots that look out of date | "Re-capture from the current commit" |
| A note that just describes the picture | "Delete that note, it's noise" |

## Reviewing and annotating

Everything below is yours to change, live, no code:

| Do this | Like this |
|---|---|
| Read one journey at a time | Flow dropdown — the URL updates, so you can paste a link to one lane |
| See a state for real, clickable | **Live screens** toggle, or **Open live ↗** on a card |
| Add / rewrite notes | Double-click a sticky (or the pencil) — one note per line, ⌘↵ to save |
| Delete a note | Hover it, click the × |
| Move a note or a label out of the way | Drag it — where you drop it is remembered |
| Rewrite what an arrow says | Double-click the label — action on top, condition underneath |
| Remove an arrow's label | Hover it, click the × (the arrow stays) |
| Clean image for a deck | Turn off **Click targets**, then **Export PNG** |
| See the file behind it | Every edit writes `public/flow-canvas/flows.json` |

Your edits are real file changes, so they show up in `git diff` and travel with the
branch. Ask Claude to "commit the canvas changes" when you're done.

The toolbar tells you the state: *Notes are editable → Saving notes… → Notes saved to
flows.json*. If it says **read-only**, you're looking at a deployed build rather than
your local dev server.

## Keeping it honest

Screenshots go stale the moment someone changes the UI:

```bash
node scripts/capture-screens.mjs
```

Run it before any handoff or design review. If a screen looks wrong afterwards, the UI
changed — that's the map doing its job.

## Handing off to devs

The canvas is the artifact. Point developers at:

- the canvas route in their own dev server
- `?flow=<lane>` to link one journey, `?live=1` to open it in live mode
- the notes, which is where conditions, gaps and open questions live
- `flows.json` in the diff, so the map reviews like code

What the map is *for*: it answers "where does this button go", "what states exist" and
"what isn't built yet" without a meeting. Anything that doesn't do one of those three
things can come off.
