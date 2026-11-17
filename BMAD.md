# BMad-Stand: Ü4 erledigt (`bmad/04-build`)

Musterlösung für Übung 4 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter.

## Was dieser Stand enthält

Alles aus `bmad/03-spec-bereit`, dazu zwei Commits:

1. `test(gh-1): ATDD scaffolds (TEA)`: `/bmad-testarch-atdd` (Murat) auf der Spec.
   Ein Unit-Test in `tests/habit-categories.test.ts` und drei E2E-Tests in
   `e2e/specs/habit-categories.spec.ts`, alle als `skip` geparkt; Checkliste mit
   AC-Register in `_bmad-output/test-artifacts/`. TEA 1.27.2 empfiehlt danach
   `dev-story`; der Weg zu `bmad-build` sind drei Zeilen, die der Mensch in die nicht
   eingefrorenen Abschnitte der Spec schreibt (Code Map, erster Task "`.skip` entfernen,
   rot sehen, dann grün", Verification-Befehl mit "0 skipped").
2. `feat(gh-1): …`: der Commit von `/bmad-build <spec>` in einer frischen Session.
   ATDD-Tests ohne `skip` und grün, Feature, neues ADR 0025, Spec mit Status `done`,
   `baseline_commit` und Review Triage Log, `deferred-work.md` mit einem geparkten Punkt.
   Ehrlich laut Build: Nur der Unit-Test wurde vorab rot gesehen, die E2E-Tests wurden erst
   nach dem Code aktiviert.

Gates auf diesem Stand: Lint, Typecheck, Unit-Tests, E2E-Tests grün.

## Von hier weitermachen (Ü5)

```bash
git fetch origin
git switch --no-track -c seminar/ab-ue5 origin/bmad/04-build
npm ci
```

Dann Test-Hooks einrichten (Git-`pre-commit`, Claude-Code-Hook auf `SubagentStop`/`Stop`)
und mit `/bmad-workflow-builder` den Skill `team-verify` bauen.

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
