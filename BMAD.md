# BMad-Stand: Ü5 erledigt (`bmad/05-verify-hooks`)

Musterlösung für Übung 5 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter.

## Was dieser Stand enthält

Alles aus `bmad/04-build`, dazu:

- `.githooks/pre-commit`, das Gate für jeden Commit, egal ob Mensch oder Agent, egal
  welches Werkzeug: kein neu hinzugefügtes `test.skip`/`.only` in `tests/` und `e2e/`,
  dann `npm run lint` und `npm test` (etwa 10 bis 20 s). Ausnahme für den einen Commit
  mit den ATDD-Scaffolds: `ALLOW_SKIP=1 git commit …`. Einschalten pro Clone:

  ```bash
  git config core.hooksPath .githooks
  ```

- `.claude/settings.json` mit `.claude/hooks/gates-on-stop.sh` auf `SubagentStop` und
  `Stop` (Blatt Ü5, Schritte 4 und 5): Hat sich in `app`, `tests` oder `e2e` seit dem
  letzten Lauf etwas geändert (Fingerabdruck des Git-Stands), laufen Lint und Unit-Tests,
  einmal pro Stand. Rot: `{"decision": "block"}` mit den Fehlerzeilen, einmal
  (Schleifenschutz `stop_hook_active`). `jq` optional, sonst `node`. Nicht auf
  `PostToolUse` mit `Edit|Write`: Der Implementierungs-Subagent von `bmad-build` schreibt
  Dateien per Bash, so ein Hook feuerte im Test kein einziges Mal. Direkt testen:

  ```bash
  echo '{"hook_event_name":"Stop","stop_hook_active":false}' \
    | .claude/hooks/gates-on-stop.sh; echo "exit $?"
  ```
- `.claude/skills/team-verify/`: eigener Skill, gebaut mit `/bmad-workflow-builder -H`
  (BMB). Führt die Befehle unter `## Verification` der Spec aus, belegt jedes Kriterium mit
  einem bestandenen Test und schreibt ein Verdict. Anpassbar über
  `_bmad/custom/team-verify.toml`. Aufruf: `/team-verify <spec>`.
- Sein Bericht `_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.verification.md`:
  alle Befehle grün, AC-1 bis AC-5 `pass`, **Verdict FAIL**, weil die Matrix-Zeile
  "Zusammenführen → `AppDataConflict`" keinen namentlich belegten Test hat.
- Bonus: `/bmad-testarch-trace` Phase 1,
  `_bmad-output/test-artifacts/traceability/traceability-matrix-gh-1.md`.

Hinweis: Bericht und Matrix stammen aus dem Testlauf, der sie erst nach den Review-Patches
aus Ü6 erzeugt hat. Deshalb nennen sie 453 Unit-Tests; auf diesem Stand sind es 452.

Hooks in Codex, Cursor oder Copilot heißen anders und sind hier nicht eingerichtet; der
Git-Hook gilt für alle.

## Von hier weitermachen (Ü6)

```bash
git fetch origin
git switch --no-track -c seminar/ab-ue6 origin/bmad/05-verify-hooks
npm ci
git config core.hooksPath .githooks
```

Dann eigene Review-Ebenen für `bmad-code-review` (`/bmad-customize` oder
`_bmad/custom/bmad-code-review.toml`), ein Review-Durchgang, Triage.

## Allgemein

- Kette: `bmad/02-installiert` → `03-spec-bereit` → `04-build` → `05-verify-hooks` →
  `06-review` → `07-retro`, jeweils auf dem vorherigen Branch aufgebaut. Was dazukam:
  `git diff origin/bmad/<vorher> origin/bmad/<dieser> --stat`.
- BMad Method 6.12.4 mit den Modulen `bmm`, `tea` (Test Architect 1.27.2) und `bmb`
  (BMad Builder 2.2.2), installiert für Claude Code (`.claude/skills/`).
- Codex, Cursor, Copilot: Die Skills liegen nur unter `.claude/skills/`. **Nicht neu
  installieren**: `--tools codex --yes` macht auf einem Stand mit `_bmad/` nur ein
  Quick-Update der vorhandenen Tools und legt `.agents/skills/` nicht an. Stattdessen
  spiegeln und committen (Blatt BMad-Vorlagen, Abschnitt 12, Handgriff 2). Der
  Lint-Ignore deckt `.agents/skills/**` schon ab:

  ```bash
  mkdir -p .agents && cp -R .claude/skills .agents/
  npm run lint
  git add .agents eslint.config.mjs
  git commit -m "chore: mirror skills to .agents/skills"
  git status --short   # leer
  ```

  Copilot in VS Code zusätzlich nach `.github/skills/` (ebenfalls im Lint-Ignore):
  `mkdir -p .github/skills && cp -R .agents/skills/bmad-* .github/skills/`, dann
  `git add .github/skills/bmad-*` und committen. Nach jedem BMad-Update neu spiegeln.
- Persönliche Einstellungen sind nicht im Repo. Ohne sie begrüßt BMad mit "BMad" und
  antwortet auf Englisch. Eigene Datei anlegen (ist gitignored):

  ```toml
  # _bmad/custom/config.user.toml
  [core]
  user_name = "Dein Name"
  communication_language = "German"
  ```

- Node 22 (`.nvmrc`), `uv` für die BMad-Skripte. Gates: `npm run lint`,
  `npm run typecheck`, `npm test`, `PORT=3110 E2E_PORT=3110 npm run test:e2e`. Nie Port 3000.
- Fork ohne diese Branches (geforkt mit "Copy the main branch only"): einmal in den
  Fork schieben, danach funktionieren alle Befehle mit `origin/`.

  ```bash
  git remote add upstream https://github.com/dinooo13/habit-tracker-demo.git
  git fetch upstream
  git push origin 'refs/remotes/upstream/bmad/*:refs/heads/bmad/*' \
    'refs/remotes/upstream/kurs/*:refs/heads/kurs/*' \
    'refs/remotes/upstream/stufe/*:refs/heads/stufe/*'
  git fetch origin
  git branch -r | grep -c 'origin/bmad/'   # 7
  ```
