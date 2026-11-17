# BMad-Stand: Epic-Pfad, Beispiel (`bmad/epic-beispiel`)

Beispiel für die Hausaufgabe im Seminar "Spec-Driven Development mit der BMad Method"
(Blatt BMad-Vorlagen, Abschnitt 16). Epic "Eigene Daten auswerten" aus Issue #3
(CSV-Export) und Issue #4 (Heatmap). Aufgebaut auf `bmad/07-retro`.

## Was dieser Stand enthält

Alles aus `bmad/07-retro`, dazu ein Commit mit dem Ordner
`_bmad-output/specs/spec-eigene-daten-auswerten/`:

- `SPEC.md`: der Epic-Kern mit 7 Capabilities (CAP-1 bis CAP-3 CSV, CAP-4 bis CAP-7
  Heatmap), je `intent` und `success`, dazu Constraints, Lieferung, Non-goals, Success
  signal, Annahmen. **Kein Abschnitt `## Open Questions`**: alle acht Fragen sind
  beantwortet. Von `bmad-spec` aus `.memlog.md` abgeleitet, nicht von Hand geändert.
- `.memlog.md`: das Protokoll, aus dem `SPEC.md` entsteht, eine Zeile pro Entscheidung,
  Annahme, Frage oder Prüfung. Ehrlich drin gelassen: ein Event "neu gerendert", das
  zu früh geschrieben wurde, und die Korrektur direkt darunter (so lief es).
- `stories.yaml`: zwei Stories, `"1"` CSV-Export (CAP-1 bis CAP-3), `"2"` Heatmap
  (CAP-4 bis CAP-7), beide `spec_checkpoint: true`, `done_checkpoint: true`,
  `invoke_dev_with: ""`.

Noch nicht enthalten: die Story-Dateien und der Code. Die entstehen erst mit einem Build
pro Story.

## Wie es entstand

Claude Code 2.1.326, `claude -p` mit `--model sonnet`, eine Session, vier Aufrufe
(der erste mit `/bmad-spec`, danach `--resume`). Persönliche Datei mit
`communication_language = "German"` (nicht im Repo).

| Aufruf | Was | Agentenzeit | Kosten kumuliert |
|---|---|---|---|
| 1 | `/bmad-spec Epic "Eigene Daten auswerten" aus Issue #3 und #4`, Text beider Issues, Slug, "Interaktiver Modus: Ich bin der Mensch im Chat" | 52 s | 0,27 USD |
| 2 | acht Antworten auf die offenen Fragen, Annahmen bestätigt | 33 s | 0,38 USD |
| 3 | `break this into stories`: Vorschlag 4 Stories oder 2, Frage nach den drei Feldern | 11 s | 0,42 USD |
| 4 | "Die 2er-Variante … beide spec_checkpoint true, done_checkpoint true, invoke_dev_with leer" | 11 s | 0,48 USD |

Zusammen **knapp 2 Minuten Agentenzeit und 0,48 USD** (`total_cost_usd` ist bei
`--resume` kumuliert, der letzte Wert zählt). Ohne den Satz "Interaktiver Modus" hält
sich `bmad-spec` bei `claude -p` für headless (kein TTY) und überspringt laut
`SKILL.md` den Story Breakdown.

Die offenen Fragen aus Aufruf 1, damit ihr eure eigenen Antworten vergleichen könnt:
CSV-Spalten, Trennzeichen (Excel mit deutscher Locale), Formelinjektion, "offen" vs.
"verpasst" in der Heatmap, Tage vor `startDate` und archivierte Habits, Muster für
Pause, Mobile mit 53 Wochen, getrennt lieferbar ja oder nein.

## Ansehen

```bash
git fetch origin
S=_bmad-output/specs/spec-eigene-daten-auswerten
git show origin/bmad/epic-beispiel:$S/SPEC.md
git show origin/bmad/epic-beispiel:$S/stories.yaml
git show origin/bmad/epic-beispiel:$S/.memlog.md
```

## Von hier weitermachen (nicht getestet)

```bash
git switch --no-track -c seminar/epic origin/bmad/epic-beispiel
npm ci
git config core.hooksPath .githooks
```

Dann pro Story eine frische Session, z. B.
`/bmad-build _bmad-output/specs/spec-eigene-daten-auswerten/ Story 1`. Build schreibt die
Story-Datei unter `stories/` und hält mit dem Team-Override am CHECKPOINT 1. Weiter wie
in Ü3 bis Ü6, dann Story 2, am Ende `bmad-retrospective` mit dem Spec-Ordner.

## Allgemein

- Kette: `bmad/02-installiert` → `03-spec-bereit` → `04-build` → `05-verify-hooks` →
  `06-review` → `07-retro` → `epic-beispiel`. Was dazukam:
  `git diff origin/bmad/07-retro origin/bmad/epic-beispiel --stat`.
- BMad Method 6.12.4 mit `bmm`, `tea` (1.27.2) und `bmb` (2.2.2), Skills unter
  `.claude/skills/`. Codex, Cursor, Copilot: spiegeln wie in `bmad/07-retro` beschrieben
  (Blatt BMad-Vorlagen, Abschnitt 12, Handgriff 2).
- Node 22 (`.nvmrc`), `uv` für die BMad-Skripte. Gates: `npm run lint`,
  `npm run typecheck`, `npm test`, `PORT=3110 E2E_PORT=3110 npm run test:e2e`. Nie Port 3000.
