---
name: spec
description: Turn a task or a GitHub issue into a reviewed specification in specs/<slug>.md. Researches the codebase and docs/adr/, asks the human about open points, then stops for approval. Use when the user wants to plan or specify a feature before coding.
argument-hint: "[issue-number | task description]"
---

# Spec

Write a build-ready specification for: **$ARGUMENTS**

You plan, you do not build. Write no code, and change no file except the spec.

## 1. Read the task

- If the argument is an issue number (`42` or `#42`), read it with
  `gh issue view <n> --json number,title,body,comments`. Read the title, the body, and
  all comments. The issue's acceptance criteria are the starting point, not the limit.
- Otherwise the argument is the task itself.
- If there is no argument, ask the user what to specify and stop.

## 2. Research

Ground every statement in real code. Name real paths, types, stores and functions.

- Read `README.md`, `docs/architecture.md`, `docs/glossary.md`, `docs/TESTING.md`,
  and `docs/e2e-testing.md`.
- Read the index in `docs/adr/README.md` and every accepted ADR the task touches.
  Accepted ADRs are settled. Design within them. If the task needs a structural
  change (data schema, persistence, a core dependency, a cross-cutting pattern),
  the spec must call for a **new ADR** instead of quietly contradicting an old one.
- Find the affected code with Grep and Glob: `app/types/app-data.ts` for the data
  model, `app/stores/`, `app/pages/`, `app/components/`, `app/utils/`, and the
  existing tests in `tests/` and `e2e/`.
- Check the side effects that are easy to miss: Zod schemas and migrations
  (`app/utils/persistence/storage-schema.ts`), backup import and export, cross-tab
  merge, demo data, and the e2e seed helpers.

## 3. Clarify with the human

Collect the open questions that change scope, data or UX. Ask them in one round,
3 to 7 questions, using AskUserQuestion when available. For each question give 2 to 4
options with a one-line trade-off and mark your recommendation first. Do not ask
what the code or an ADR already answers. Ask a second round only if the answers
opened new questions. Record every decision for the spec.

## 4. Write the spec

Pick a short kebab-case slug (for example `habit-categories`) and write
`specs/<slug>.md` with exactly these sections:

```markdown
# <Title>

Issue: #<n> (or "none")  ·  Status: draft, waiting for approval

## Context
Why we build this and for whom, in 2 to 4 sentences.

## Research
| File | Why it matters |
Relevant ADRs and what they constrain. Decisions from the clarification round.

## Requirements
### Must
### Should
### Won't (this time)

## Non-goals
What we explicitly do not change.

## Tasks
1. Small, ordered, each testable on its own (test first, then code).
   Name the files each task touches.

## Acceptance criteria
- [ ] AC1: observable behavior a user or a test can check.

## Verification plan
| AC | How we prove it | Type (unit / e2e / browser) |
Gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`.
Browser walk: the exact clicks for each user-facing AC, including a reload.
```

Rules for the content:

- Every acceptance criterion is testable and appears in the verification plan.
- Cover the hard states: empty lists, active filters, reload, old data and old
  backups, mobile width.
- Data changes say whether `schemaVersion` changes and how old data migrates.
- Keep it short. A reviewer should read it in five minutes.

## 5. Stop for approval

Show the user the spec path, a five-line summary, and the decisions you made.
Then **stop**. Do not start coding. Implementation starts only after the human
approves the spec, with `/code specs/<slug>.md`.
