#!/usr/bin/env bash
# gates-on-stop.sh: hook on SubagentStop and Stop (Claude Code).
# bmad-build writes files with Bash, an Edit|Write hook never sees that.
# So we look at Git instead: code changed since the last run -> lint and
# unit tests. Red: {"decision":"block"} once, the agent keeps working.
in="$(cat)"
case "$in" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac
cd "$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel)" || exit 0
paths="app tests e2e"                     # Weg A: eure Code-Ordner
[ -n "$(git status --porcelain -- $paths)" ] || exit 0

# Fingerprint of the changes: run once per state, not per subagent.
fp=$( { git diff HEAD -- $paths
        git ls-files -o --exclude-standard -- $paths \
          | git hash-object --stdin-paths; } | git hash-object --stdin )
state="$(git rev-parse --git-path gates-on-stop.fp)"
[ "$fp" = "$(cat "$state" 2>/dev/null)" ] && exit 0
echo "$fp" > "$state"

out=$( { npm run --silent lint && npm test --silent; } 2>&1 ); rc=$?
ev=$(printf '%s' "$in" | sed -n 's/.*"hook_event_name": *"\([A-Za-z]*\)".*/\1/p')
echo "$(date +%T) gates-on-stop $ev rc=$rc" >> "$(git rev-parse --git-dir)/hook.log"
[ $rc -eq 0 ] && exit 0
export REASON="Lint or unit tests fail. Fix the cause, do not skip or weaken a
test, then finish again. $(printf '%s\n' "$out" | tail -n 25)"
if command -v jq >/dev/null; then jq -n '{decision:"block",reason:env.REASON}'
else node -e 'console.log(JSON.stringify(
  {decision: "block", reason: process.env.REASON}))'; fi
