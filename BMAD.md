# BMad-Stand: Ü3 erledigt (`bmad/03-spec-bereit`)

Musterlösung für Übung 3 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter.

## Was dieser Stand enthält

Alles aus `bmad/02-installiert`, dazu:

- Brainstorming (`/bmad-brainstorming`, Partner-Modus, 15 Minuten, zwei Techniken:
  Morphological Analysis und Worst Possible Idea), abgelegt, wie BMad es vorsieht:
  `_bmad-output/brainstorming/brainstorm-habit-categories-filter-2026-11-17/`
  mit `brainstorm-intent.md` (Richtung, 5 Entscheidungen und Risiken, Test-Hinweise)
  und dem Protokoll `.memlog.md`.
- Die Spec `_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md`
  aus `/bmad-build` bis CHECKPOINT 1, Status `ready-for-dev`. Antworten auf die beiden
  Open Questions: "1: A, feste Liste (Health, Learning, Work). 2: A, Leerzustand mit
  Reset-Button." Freigabe mit "Approve and stop". Die Person, die den Build gestartet hat,
  hat die Spec allein committet: `docs(spec): ready-for-dev gh-1-habit-categories-filter`.

Hinweis: Die Spec stammt aus einem Lauf, der das Issue ohne den Brainstorm-Intent bekam.
Mit dem Intent als Input wurde die Spec im Test deutlich länger (Schema v3, pflegbare
Liste); die beiden Antworten oben halten den Umfang klein. Genau das lohnt sich zu
vergleichen: Was aus dem Brainstorming nehmt ihr in die Spec, was bewusst nicht?

## Von hier weitermachen (Ü4)

```bash
git fetch origin
git switch --no-track -c seminar/ab-ue4 origin/bmad/03-spec-bereit
npm ci
```

Dann `/bmad-testarch-atdd` mit der Spec als Story-Datei, drei Zeilen in die Spec
(Code Map, Task "unskip, rot sehen", Verification-Befehl), frische Session
`/bmad-build <spec>`.

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
