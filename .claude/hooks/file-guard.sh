#!/usr/bin/env bash
# file-guard.sh: hook on SubagentStop and Stop. A risky file differs from
# HEAD (changed by any tool, Bash included) -> run its fast test.
# Green: short message. Red: {"decision":"block","reason":...}, the agent
# keeps working on the cause. No risky change: no output, exit 0.

# ---- <ANPASSEN> -----------------------------------------------------------
# Riskante Dateien oder Ordner, relativ zum Repo-Root, mit Leerzeichen getrennt
RISKY="app/types/app-data.ts app/utils/persistence"
# Schneller Testbefehl (Sekunden, nicht Minuten). Läuft im Repo-Root.
CHECK='npx vitest run --project unit storage-schema schema-migrations pause-mode'
# ---------------------------------------------------------------------------

in="$(cat)"
# 1. Loop guard: the agent already continues because of a stop hook.
case "$in" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac

# 2. Repo root: Claude Code sets CLAUDE_PROJECT_DIR, otherwise the cwd.
cd "$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel)" || exit 0

# 3. Only if a risky file differs from HEAD (changed, new or deleted).
changed="$(git status --porcelain -- $RISKY | cut -c4- | xargs)"
[ -n "$changed" ] || exit 0

# 4. Report as JSON: jq, else python3, else node. $1 = block | ok
json() {
  export MODE="$1" TEXT="$2"
  if command -v jq >/dev/null; then
    jq -n 'if env.MODE == "block" then {decision: "block", reason: env.TEXT}
           else {systemMessage: env.TEXT} end'
  elif command -v python3 >/dev/null; then python3 -c '
import json, os
t, m = os.environ["TEXT"], os.environ["MODE"]
o = {"decision": "block", "reason": t} if m == "block" else {"systemMessage": t}
print(json.dumps(o, ensure_ascii=False))'
  else node -e '
const { MODE: m, TEXT: t } = process.env
const o = m === "block" ? { decision: "block", reason: t } : { systemMessage: t }
console.log(JSON.stringify(o))'
  fi
}

# 5. Run the fast test, log the event, answer.
out="$(NO_COLOR=1 bash -c "$CHECK" 2>&1)"; rc=$?
ev="$(printf '%s' "$in" | sed -n 's/.*"hook_event_name": *"\([A-Za-z]*\)".*/\1/p')"
echo "$(date +%T) file-guard $ev rc=$rc" >> "$(git rev-parse --git-dir)/hook.log"
if [ $rc -eq 0 ]; then
  json ok "file-guard: $changed geändert, Tests grün"
else
  json block "Tests rot nach Änderung an $changed. Behebe die Ursache,
schwäche keinen Test ab. Befehl: $CHECK
$(printf '%s\n' "$out" | tail -n 30)"
fi
exit 0
