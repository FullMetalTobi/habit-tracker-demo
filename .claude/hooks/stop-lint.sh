#!/bin/bash
# SubagentStop + Stop: block the end of a subagent or turn once if lint fails
# (loop guard). Fires for Bash writes too, unlike PostToolUse on Edit|Write.
in=$(cat); cd "$CLAUDE_PROJECT_DIR" || exit 0
log="$(git rev-parse --git-dir)/hook.log"
ev=$(jq -r '.hook_event_name // "Stop"' <<<"$in")
[ "$(jq -r '.stop_hook_active' <<<"$in")" = "true" ] && exit 0
out=$(npm run --silent lint 2>&1); rc=$?
echo "$(date +%T) $ev lint rc=$rc" >> "$log"
[ $rc -eq 0 ] && exit 0
{ echo "Hook: npm run lint fails, fix it before you finish:"
  tail -n 20 <<<"$out"; } >&2
exit 2
