# flows.json schema

Single source of truth for the canvas. Lives at `public/flow-canvas/flows.json`;
screenshots live at `public/flow-canvas/screens/` and are referenced relative to the
document (`screens/01-dashboard.jpg`).

## Top level

| Field | Type | Notes |
|---|---|---|
| `project` | string | Shown in the toolbar and used as the PNG filename. |
| `version` | string | Free text — a date works well for handoff. |
| `flows` | array | One lane per entry, rendered top to bottom. |

## Flow

| Field | Type | Notes |
|---|---|---|
| `id` | string, required | Unique, kebab-case. Used by the `?flow=` filter. |
| `name` | string, required | Rendered as the lane's black band header. |
| `description` | string | One line under the band. |
| `notes` | string[] | Flow-level sticky, pinned left of the lane. Editable on the canvas. |
| `noteOffset` | `{x,y}` | Where the flow sticky was dragged, relative to its laid-out spot. |
| `stages` | array | Non-screen markers: entry points, exits, decisions. |
| `screens` | array | The screens in the lane. |
| `transitions` | array | Directed edges between screens/stages. **A flow with none is laid out as a plain row.** |

## Stage

| Field | Type | Notes |
|---|---|---|
| `id` | string, required | Unique across the whole document. |
| `kind` | `start` \| `end` \| `decision` | Drives shape and colour. |
| `label` | string, required | e.g. "Payment confirmed server-side". |

Use stages for things that aren't screens: an email that starts the journey, a
backend decision, an exit to another surface.

## Screen

| Field | Type | Notes |
|---|---|---|
| `id` | string, required | Globally unique. Referenced by transitions. |
| `title` | string, required | Card header. |
| `route` | string | URL path, or the step id inside a modal (`step: confirm`). |
| `image` | string | Path relative to the document. Omit for a placeholder. |
| `live` | string | In-app URL that renders this state for real. Powers "Open live" and the live-frame toggle. |
| `liveHint` | string | Extra clicks needed after opening `live`, when the state has no direct URL. Shown as a caption in live mode. |
| `status` | `ready` \| `wip` \| `needs-review` | Border style: solid / dashed / red. |
| `description` | string | Inspector only. |
| `notes` | string[] | Rendered as the sticky note below the card. Editable on the canvas. |
| `noteTone` | `default` \| `warn` \| `flow` | Sticky colour. |
| `noteOffset` | `{x,y}` | Where the sticky was dragged, relative to its laid-out spot. |
| `hotspots` | array | Click targets drawn over the screenshot. |

## Hotspot

| Field | Type | Notes |
|---|---|---|
| `id` | string, required | Convention: `<screen-id>__<control>`. |
| `label` | string, required | Short — it renders inside the box. |
| `x`, `y` | number, required | Top-left corner as % of the screenshot. |
| `w`, `h` | number | Size as % of the screenshot. Defaults: 12 and 5. |
| `note` | string | Conditions, disabled states, or which handler it calls. Shows on hover and in the inspector. |

Hotspots are numbered in array order, so list them in the order a user encounters
them. **Only add a hotspot for an element that has a handler** — see the SKILL note
on labels-that-look-like-CTAs.

## Transition

| Field | Type | Notes |
|---|---|---|
| `from` | string, required | Screen or stage id. |
| `to` | string, required | Screen or stage id. |
| `fromHotspot` | string | Hotspot id on the source screen. Omit and the arrow leaves the card's right edge. |
| `action` | string | Edge label, in the user's words: `Click 'Confirm'`, `Auto-redirect`. Empty/missing hides the label but keeps the arrow. |
| `condition` | string | Renders under the label as `if <condition>`. |
| `variant` | `primary` \| `alt` \| `error` \| `back` | Colour and dash pattern. `primary` animates. |
| `labelOffset` | `{x,y}` | Where the label was dragged, relative to the arrow's midpoint. |

## Minimal valid document

```json
{
  "project": "Acme",
  "flows": [
    {
      "id": "signup",
      "name": "Global entry point",
      "screens": [
        {
          "id": "landing",
          "title": "Landing",
          "image": "screens/landing.jpg",
          "live": "/dev/screens?page=landing",
          "hotspots": [{ "id": "landing__cta", "label": "Get started", "x": 42, "y": 61, "w": 16, "h": 6 }]
        },
        { "id": "form", "title": "Details form", "image": "screens/form.jpg" }
      ],
      "transitions": [
        { "from": "landing", "fromHotspot": "landing__cta", "to": "form", "action": "Click 'Get started'" }
      ]
    }
  ]
}
```

## Validation

```bash
python3 scripts/validate.py <app>/public/flow-canvas/flows.json
```

Checks that every `from`/`to` resolves, every `fromHotspot` exists on its source
screen, hotspot coordinates are in range, no screen id is duplicated across flows,
and every referenced image file is present. Run it after any hand edit — a typo'd
hotspot id is the most common breakage and it fails silently in the browser.
