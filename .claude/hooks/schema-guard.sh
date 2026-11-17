#!/bin/bash
# SubagentStop + Stop: the data schema changed (by any tool, Bash included)
# -> run the fast schema tests (~2 s); block the stop once if they fail.
in=$(cat); cd "$CLAUDE_PROJECT_DIR" || exit 0
log="$(git rev-parse --git-dir)/hook.log"
ev=$(jq -r '.hook_event_name // "Stop"' <<<"$in")
who=$(jq -r '.agent_type // "main"' <<<"$in")
[ "$(jq -r '.stop_hook_active' <<<"$in")" = "true" ] && exit 0
git diff --quiet HEAD -- app/types/app-data.ts app/utils/persistence && exit 0
out=$(npx vitest run tests/storage-schema.test.ts \
  tests/schema-migrations.test.ts 2>&1); rc=$?
echo "$(date +%T) $ev schema-guard agent=$who rc=$rc" >> "$log"
[ $rc -eq 0 ] && exit 0
{ echo "Hook schema-guard: schema tests fail after a schema change:"
  tail -n 25 <<<"$out"; } >&2
exit 2
