#!/bin/bash
# SessionStart (cloud only): copy the public plan repo next to this repo, read-only, and print the current handoff.
# Local sessions load the handoff through the @import in CLAUDE.md, so this exits early there.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
DEV="$CLAUDE_PROJECT_DIR"
PLAN_NAME="$(basename "$DEV" | sed -E 's/-dev$/-plan/')"
PLAN="$(dirname "$DEV")/$PLAN_NAME"
SLUG="$(git -C "$DEV" remote get-url origin 2>/dev/null | sed -E 's#\.git$##; s#.*[/:]([^/:]+)/([^/:]+)$#\1/\2#; s#-dev$#-plan#')"
URL="${PLAN_GIT_BASE:-https://github.com}/$SLUG"
if [ -d "$PLAN/.git" ]; then
  git -C "$PLAN" fetch -q --depth 1 origin >/dev/null 2>&1 && git -C "$PLAN" reset -q --hard FETCH_HEAD >/dev/null 2>&1
else
  GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 "$URL" "$PLAN" >/dev/null 2>&1
fi
H="$PLAN/docs/current/handoff.md"
if [ -f "$H" ]; then
  echo "## Current handoff (read-only copy of $PLAN_NAME at $PLAN; do not edit it)"
  cat "$H"
else
  echo "Handoff not loaded: could not get $URL into $PLAN. Tell the user before implementing anything."
fi
exit 0
