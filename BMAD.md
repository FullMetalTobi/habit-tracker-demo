# BMad-Stand: Ü7 erledigt (`bmad/07-retro`)

Musterlösung für Übung 7 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter. Endstand der Kette.

## Was dieser Stand enthält

Alles aus `bmad/06-review`, dazu:

- `_bmad-output/implementation-artifacts/gh-1-retro-2026-11-17.md`: `/bmad-retrospective -H`
  auf der einen Spec, ohne Epic und ohne `sprint-status.yaml`. Verdict
  `accepted-with-open-items`, Befunde mit Quelle (Architektur-Delta, Duplikation,
  Größenwachstum, Pattern-Abweichung, Spec-zu-Umsetzung), Aktionspunkte nur vorgeschlagen.
  Der Kopf des Dokuments erklärt, was gegenüber der Ausgabe im Testlauf angepasst ist.
- `_bmad-output/implementation-artifacts/deferred-work.md`: was Build und Code Review
  geparkt haben. Retro-Aktion 3 ist umgesetzt (der Enum-Punkt ist als geklärt markiert),
  der Defer-Punkt aus dem Review ist offen.

Nicht im Repo: der Team-Plan aus Ü7 (gehört in euer eigenes Repo bzw. Wiki) und ein
Draft-MR. `bmad-build` pusht nie; den MR legt ihr selbst an (`gh pr create --draft`
bzw. `glab mr create --draft`). `bmad-sprint-planning` braucht Epics und lehnt ein
einzelnes Ticket ab (Gate FAIL).

## Von hier weitermachen (Hausaufgabe)

```bash
git fetch origin
git switch --no-track -c seminar/ende origin/bmad/07-retro
npm ci
git config core.hooksPath .githooks
```

Dann der Epic-Pfad: `/bmad-spec` für Issue #3 und #4 (oder ein eigenes Epic), ein Build
pro Story.

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
  git branch -r | grep -c 'origin/bmad/'   # 6
  ```
