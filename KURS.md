# Kurs: Spec-Driven Development mit KI-Coding-Agenten

Der SDD-Workflow `spec` → `code` → `verify` entsteht hier Stufe für Stufe am Issue #1
(Kategorien für Habits mit Filter). Jede Stufe ist ein Branch, der auf der vorherigen
aufbaut: `git switch stufe/03-code`. Die Skills liegen unter `.claude/skills/`.

| Branch | Was dazukommt | Diff zur Vorstufe |
| --- | --- | --- |
| `main` | Ausgangsprojekt: Nuxt 4, Pinia, Dexie, Zod, Tests | – |
| `stufe/01-spec-starter` | Minimaler, generischer `spec`-Skill | `git diff main stufe/01-spec-starter` |
| `stufe/02-spec-voll` | Voller `spec`-Skill (Issue per `gh`, Recherche per Subagent, ADRs, Rückfragen, Stopp) und `AGENTS.md`; Ergebnis `specs/kategorien.md` | `git diff stufe/01-spec-starter stufe/02-spec-voll` |
| `stufe/03-code` | `code`-Skill (TDD, kleine Commits, Gates); Ergebnis: Feature #1 in kleinen Commits | `git diff stufe/02-spec-voll stufe/03-code` |
| `stufe/04-verify-gates` | `verify` v1: Lint, Typecheck, Unit-Tests, Bericht `specs/kategorien.verification.md` | `git diff stufe/03-code stufe/04-verify-gates` |
| `stufe/05-verify-e2e` | `verify` v2: plus E2E-Tests mit Playwright auf Port 3110 | `git diff stufe/04-verify-gates stufe/05-verify-e2e` |
| `stufe/06-verify-spec-abgleich` | `verify` v3: plus Beleg für jedes Akzeptanzkriterium | `git diff stufe/05-verify-e2e stufe/06-verify-spec-abgleich` |
| `stufe/07-verify-review` | `verify` v4: plus Review durch frischen Subagenten `reviewer` | `git diff stufe/06-verify-spec-abgleich stufe/07-verify-review` |
| `stufe/08-verify-browser` | `verify` v5: plus Browser-Check mit `playwright-cli` | `git diff stufe/07-verify-review stufe/08-verify-browser` |
| `stufe/09-verify-hook` | Hook `schema-guard` und Skill `schema-change`: Schema-Tests laufen deterministisch nach jeder Schema-Änderung | `git diff stufe/08-verify-browser stufe/09-verify-hook` |
| `stufe/10-verify-pr` | `verify` v6: mit `--pr` ein Draft-PR, der auf das Issue verweist | `git diff stufe/09-verify-hook stufe/10-verify-pr` |

Nur eine Datei ansehen: `git diff stufe/04-verify-gates stufe/05-verify-e2e -- .claude/skills/verify/SKILL.md`.
Nur die Übersicht: `--stat` anhängen.

Gates: `npm run lint`, `npm run typecheck`, `npm test`,
`PORT=3110 E2E_PORT=3110 npm run test:e2e`. Nie Port 3000.

## Hausaufgabe

Baut Issue #3 (CSV-Export der Check-ins) und Issue #4 (Heatmap pro Habit) mit dem fertigen
Workflow von `stufe/10-verify-pr`:

1. `/spec 3`, Rückfragen beantworten, Spec freigeben.
2. Neue Session: `/code specs/<slug>.md`.
3. Neue Session: `/verify specs/<slug>.md --pr`.

Vergleicht eure Spec und euren Bericht danach mit denen eurer Kolleginnen und Kollegen.
