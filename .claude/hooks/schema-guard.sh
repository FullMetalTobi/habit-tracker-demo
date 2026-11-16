#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write).
#
# When Claude edits the data model or the schema/migration code, run the schema
# and migration tests right away and remind Claude of the schema-change skill.
# Any other file: exit 0 silently and fast.
#
# Input: the hook JSON on stdin (we only need tool_input.file_path).
# Output: JSON on stdout. Pass -> additionalContext. Fail -> decision "block",
# which feeds the failing tests back to Claude (the edit itself already happened).
# jq is optional; without it the script falls back to node for JSON.

set -uo pipefail

input="$(cat)"

json_get_file_path() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null
  else
    printf '%s' "$input" | node -e '
      let s = ""; process.stdin.on("data", d => (s += d)).on("end", () => {
        try { process.stdout.write(JSON.parse(s)?.tool_input?.file_path ?? "") } catch {}
      })' 2>/dev/null
  fi
}

file_path="$(json_get_file_path)"
[ -n "$file_path" ] || exit 0

# Files that define the persisted shape or how old data is migrated.
case "$file_path" in
  */app/types/app-data.ts \
  | */app/utils/persistence/storage-schema.ts \
  | */app/utils/persistence/schema-migrations.ts \
  | */app/utils/persistence/legacy-migration.ts) ;;
  *) exit 0 ;;
esac

# Run in the repo that owns the file (works in worktrees, too).
repo_root="$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)"
repo_root="${repo_root:-${CLAUDE_PROJECT_DIR:-$PWD}}"
cd "$repo_root" || exit 0

vitest="./node_modules/.bin/vitest"
rel_path="${file_path#"$repo_root"/}"
skill_hint="Changed file $rel_path is part of the persisted data schema. The project skill schema-change (.claude/skills/schema-change/SKILL.md) lists every place that has to change with it: type, Zod schema, migration registry, merge, demo data, old backups, tests."

emit() {
  # $1 = mode (context|block), $2 = text, $3 = message for the user
  if command -v jq >/dev/null 2>&1; then
    if [ "$1" = block ]; then
      jq -n --arg r "$2" --arg m "$3" '{decision: "block", reason: $r, systemMessage: $m}'
    else
      jq -n --arg c "$2" --arg m "$3" \
        '{systemMessage: $m, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $c}}'
    fi
  else
    MODE="$1" TEXT="$2" MSG="$3" node -e '
      const { MODE, TEXT, MSG } = process.env
      const out = MODE === "block"
        ? { decision: "block", reason: TEXT, systemMessage: MSG }
        : { systemMessage: MSG, hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: TEXT } }
      process.stdout.write(JSON.stringify(out))'
  fi
}

if [ ! -x "$vitest" ]; then
  emit context "$skill_hint Schema tests were not run: node_modules is missing (run npm install)." \
    "schema-guard: $rel_path changed, tests skipped (no node_modules)"
  exit 0
fi

# Vitest file filters: only the schema and migration suites in the fast Node project.
filters=(storage-schema schema-migrations pause-mode legacy-migration)
start=$(date +%s)
output="$(BROWSERSLIST_IGNORE_OLD_DATA=1 "$vitest" run --project unit "${filters[@]}" 2>&1)"
status=$?
duration=$(( $(date +%s) - start ))
summary="$(printf '%s\n' "$output" | sed 's/\x1b\[[0-9;]*m//g' | grep -E '^ *(Test Files|Tests) ' | tr -s ' ' | sed 's/^ //' | paste -sd ';' - | sed 's/;/; /g')"

if [ "$status" -eq 0 ]; then
  emit context "$skill_hint Schema and migration tests passed (${summary:-ok}, ${duration}s)." \
    "schema-guard: $rel_path changed, schema tests green in ${duration}s"
else
  tail_out="$(printf '%s\n' "$output" | sed 's/\x1b\[[0-9;]*m//g' | grep -v -i browserslist | tail -n 60)"
  emit block "Schema and migration tests failed after editing $rel_path (${summary:-see output}). $skill_hint
Last lines of the test run:
$tail_out" \
    "schema-guard: $rel_path changed, schema tests RED"
fi
exit 0
