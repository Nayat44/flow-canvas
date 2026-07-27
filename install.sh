#!/usr/bin/env bash
# Copies every skill in skills/ into ~/.claude/skills/ so Claude Code can see it in any
# project. Pass a repo path to install into that repo's .claude/skills/ instead.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target="${1:-$HOME/.claude}/skills"

mkdir -p "$target"

for skill in "$here"/skills/*/; do
  name="$(basename "$skill")"
  if [ -e "$target/$name" ]; then
    echo "↻ replacing $target/$name"
    rm -rf "$target/$name"
  else
    echo "+ installing $target/$name"
  fi
  cp -R "$skill" "$target/$name"
done

echo
echo "Done. Start Claude Code and ask it to \"use the flow-canvas skill\"."
echo "Designers: read skills/flow-canvas/references/designer-playbook.md"
