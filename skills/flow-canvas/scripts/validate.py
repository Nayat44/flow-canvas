#!/usr/bin/env python3
"""Check a flows.json for broken references before you spend time in the browser.

Usage: python3 .claude/skills/flow-canvas/scripts/validate.py \
           apps/web-borrow/public/flow-canvas/flows.json

Reports: unknown from/to ids, fromHotspot ids that do not exist on their source
screen, out-of-range hotspot coordinates, duplicate screen ids, missing image files,
and transitions with no action label.
"""
import json
import os
import sys


def main(path):
    with open(path) as f:
        doc = json.load(f)

    root = os.path.dirname(os.path.abspath(path))
    errors, warnings = [], []
    seen_ids = {}

    for flow in doc.get("flows", []):
        fid = flow.get("id", "<missing id>")
        node_ids, hotspot_ids = set(), set()

        for stage in flow.get("stages", []):
            node_ids.add(stage.get("id"))

        for screen in flow.get("screens", []):
            sid = screen.get("id")
            if sid in seen_ids:
                errors.append(f"duplicate screen id '{sid}' (also in flow '{seen_ids[sid]}')")
            seen_ids[sid] = fid
            node_ids.add(sid)

            img = screen.get("image")
            if img and not os.path.exists(os.path.join(root, img)):
                warnings.append(f"[{fid}] missing image file: {img}")
            if not img:
                warnings.append(f"[{fid}] screen '{sid}' has no screenshot")

            for h in screen.get("hotspots", []):
                hotspot_ids.add(h.get("id"))
                for axis in ("x", "y"):
                    v = h.get(axis)
                    if v is None or not 0 <= v <= 100:
                        errors.append(
                            f"[{fid}] hotspot '{h.get('id')}' has {axis}={v}, expected 0-100"
                        )
                if h.get("x", 0) + h.get("w", 12) > 100 or h.get("y", 0) + h.get("h", 5) > 100:
                    warnings.append(
                        f"[{fid}] hotspot '{h.get('id')}' extends past the screenshot edge"
                    )

        for i, t in enumerate(flow.get("transitions", [])):
            for end in ("from", "to"):
                if t.get(end) not in node_ids:
                    errors.append(
                        f"[{fid}] transition {i}: '{end}' points at unknown id '{t.get(end)}'"
                    )
            fh = t.get("fromHotspot")
            if fh and fh not in hotspot_ids:
                errors.append(f"[{fid}] transition {i}: fromHotspot '{fh}' does not exist")
            if not t.get("action"):
                warnings.append(
                    f"[{fid}] transition {i} ({t.get('from')} -> {t.get('to')}) has no action label"
                )

    for w in warnings:
        print(f"warn  {w}")
    for e in errors:
        print(f"ERROR {e}")

    print(
        f"\n{len(doc.get('flows', []))} flow(s), {len(seen_ids)} screen(s), "
        f"{len(errors)} error(s), {len(warnings)} warning(s)"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
