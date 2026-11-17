# BMad-Stand: Ü6 erledigt (`bmad/06-review`)

Musterlösung für Übung 6 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter.

## Was dieser Stand enthält

Alles aus `bmad/05-verify-hooks`, dazu drei Commits:

1. `_bmad/custom/bmad-code-review.toml`: drei eigene Review-Ebenen
   (`[[workflow.review_layers]]`): Standards/ADR (liest `AGENTS.md` und den ADR-Index),
   Security (`when`: nur bei Änderungen unter `app/`), Lint als externes Werkzeug per Bash
   (`when`: nur bei `.ts`, `.vue`, `.mjs`). Den Spec-Abgleich macht der eingebaute
   `acceptance-auditor`; eine eigene Ebene mit derselben `id` würde ihn samt `when`
   ersetzen. Neu gegenüber dem Testlauf (nicht mit Agent getestet): eine Team-Regel
   `persistent_facts`, dass akzeptierte ADRs beim Patchen nicht editiert werden.
   Prüfen: `uv run _bmad/scripts/resolve_customization.py --skill
   .claude/skills/bmad-code-review --project-root . --key workflow.review_layers`.
2. `fix(gh-1): apply code review patches`: Ergebnis von `/bmad-code-review <spec>` mit
   allen sieben Ebenen, Triage 2 decision, 2 patch, 1 defer, 13 verworfen. Patches:
   `updateHabit` behält die Kategorie (mit Test), Badge im E2E-Test geprüft. Entscheidungen
   und Verworfenes stehen in der Spec unter "Review Findings", der Defer-Punkt in
   `deferred-work.md`. Im Testlauf hat der Agent dabei das akzeptierte ADR 0025 editiert
   (verboten laut `AGENTS.md`); diese Änderung ist hier bewusst nicht übernommen.
3. Guard für die riskante Datei (Schema): `.claude/hooks/schema-guard.sh` auf
   `SubagentStop` und `Stop` startet die Schema-Tests, sobald `app/types/app-data.ts` oder
   `app/utils/persistence/` geändert sind, egal mit welchem Werkzeug. `.githooks/pre-commit`
   lehnt eine Schema-Änderung ohne neues ADR im selben Commit ab. Grenze: Auch ein kleiner
   Fix am Schema braucht dann ein neues ADR.

## Von hier weitermachen (Ü7)

```bash
git fetch origin
git switch --no-track -c seminar/ab-ue7 origin/bmad/06-review
npm ci
git config core.hooksPath .githooks
```

Dann `/bmad-retrospective` kurz auf der Spec, Team-Plan, Bonus Draft-MR.

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
