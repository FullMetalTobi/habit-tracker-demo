
- source_spec: `_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md`
  summary: Striktes `category`-Enum lässt den ganzen Datensatz scheitern, wenn ein unbekannter Key gespeichert ist (z. B. nach Rollback).
  evidence: Unverifiziert; prüfen, ob parseAppData dann auf leeren Zustand fällt oder in Quarantäne geht.
  resolved: Im Code Review geprüft (parseAppData wirft, leerer Zustand mit Recovery-Banner, Payload in Quarantäne); Entscheidung strikt lassen, siehe Review Findings der Spec. Nachgetragen nach Retro-Aktion 3.

## Deferred from: code review of spec-gh-1-habit-categories-filter (2026-11-17)

- Today-Text „All X habits have been reviewed.“ unter Kategorie-Filter ist nicht getestet (nur der „are done“-Zweig aus AC-3). Settle: e2e mit komplett bearbeitetem Tag und gesetztem Filter. (`app/pages/app/index.vue:657`)
