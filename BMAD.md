# BMad-Stand: Ü2 erledigt (`bmad/02-installiert`)

Musterlösung für Übung 2 im Seminar "Spec-Driven Development mit der BMad Method"
(Weg B). Issue #1: Kategorien für Habits mit Filter.

## Was dieser Stand enthält

- BMad 6.12.4 (44 Skills in `.claude/skills/`, Konfiguration in `_bmad/`), installiert mit

  ```bash
  npx -y bmad-method@6.12.4 install --directory . --modules bmm,tea,bmb \
    --tools claude-code --yes --user-name Seminar \
    --communication-language German --document-output-language German
  ```
- `eslint.config.mjs`: ignoriert `.claude/skills/**` und `_bmad/**`. Ohne das bricht
  `npm run lint` nach der TEA-Installation (373 Fehler in einer TEA-Hook-Datei).
- `.gitignore`: persönliche Install-Antworten (`_bmad/config.user.toml`,
  `_bmad/core/config.yaml`, `_bmad/bmm/config.yaml`). `_bmad/tea/config.yaml` und
  `_bmad/bmb/config.yaml` bleiben im Repo, weil alle TEA- und BMB-Skills sie lesen.
  `_bmad/custom/*.user.toml` ignoriert BMad selbst.
- `AGENTS.md`: Gates, Architektur, harte Regeln, ADRs.
- `_bmad/custom/bmad-build.toml`: Team-Regeln für `bmad-build` (immer volle Spec und
  Halt an CHECKPOINT 1, Freigabe nach BMad mit "Approve and stop", Test zuerst).
  Prüfen, was ankommt:

  ```bash
  uv run _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-build \
    --project-root . --key workflow.persistent_facts
  ```

## Von hier weitermachen (Ü3)

```bash
git fetch origin
git switch --no-track -c bmad-ab-ue3 origin/bmad/02-installiert
npm ci
```

Dann `/bmad-brainstorming` zu Issue #1 und `/bmad-build` bis CHECKPOINT 1.
Andere Werkzeuge (Codex, Cursor, Copilot): BMad dort selbst installieren
(`--tools <tool>`), dieser Stand enthält nur die Claude-Code-Skills.

## Allgemein

- Kette: `bmad/02-installiert` → `03-spec-bereit` → `04-build` → `05-verify-hooks` →
  `06-review` → `07-retro`, jeweils auf dem vorherigen Branch aufgebaut. Was dazukam:
  `git diff origin/bmad/<vorher> origin/bmad/<dieser> --stat`.
- BMad Method 6.12.4 mit den Modulen `bmm`, `tea` (Test Architect 1.27.2) und `bmb`
  (BMad Builder 2.2.2), installiert für Claude Code (`.claude/skills/`).
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
  git push origin 'refs/remotes/upstream/bmad/*:refs/heads/bmad/*'
  git fetch origin
  ```
