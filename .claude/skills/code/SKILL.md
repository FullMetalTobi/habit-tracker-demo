---
name: code
description: Implement an approved specification from specs/ task by task, test first, with small Conventional Commits. Lint, typecheck and tests must be green at the end.
argument-hint: "[specs/<slug>.md]"
disable-model-invocation: true
---

# Code

Implement the approved spec: **$ARGUMENTS**

## 1. Load the spec

- If the argument is empty, list `specs/*.md` and ask which spec to implement.
- Read the whole spec. It is the source of truth for scope: build what it asks
  for, no more and no less.
- Check that the human approved it. If the status still says "draft" and the user
  did not approve it in this conversation, ask before you write code.
- Read the files listed under Research and the ADRs it names. Respect every
  accepted ADR. If the spec asks for a new ADR, write it as part of the tasks:
  next free number in `docs/adr/`, and add it to `docs/adr/README.md`.

## 2. Prepare the branch

- Never work on `main`. If you are on `main`, create a branch first, for example
  `feat/<slug>` (include the issue number if there is one: `feat/12-<slug>`).
- Start from a clean working tree. Run `npm test` once so you know the baseline is
  green before you change anything.

## 3. Work the tasks in a TDD cycle

For each task in the spec, in order:

1. **Red.** Write or extend a test that describes the task's behavior and run it.
   It must fail for the right reason. Unit tests go to `tests/` (rendered
   components under `tests/nuxt/`), user flows go to `e2e/specs/`.
2. **Green.** Write the smallest change that makes the test pass. Follow the
   surrounding patterns: `<script setup>`, Pinia stores with `hydrate`/`snapshot`,
   Zod validation for everything loaded or imported, date keys from
   `app/utils/domain/date.ts`, Nuxt UI components.
3. **Refactor.** Clean up while the tests stay green.
4. **Commit.** One small commit per task in Conventional Commits format:
   `feat(categories): add category field to habit schema`,
   `test(e2e): cover category filter after reload`, `fix: …`, `docs(adr): …`.
   The message says what and why. Never commit a red state.

Update the spec's task list as you go (`- [x]`) so a new session can resume.

If a task turns out wrong or impossible, stop and tell the user. Do not change the
scope on your own. Small details the spec left open are fine to decide; note them
in the final report.

## 4. Gates

When all tasks are done, run and make green:

```bash
npm run lint
npm run typecheck
npm test
```

Run `npm run test:e2e` as well when you touched UI or flows. Fix failures at the
cause. Never weaken, skip or delete a test to get green.

## 5. Report

Tell the user:

- the branch and the list of commits,
- which tasks are done and which decisions you made on the way,
- the gate results,
- anything open or risky.

Then suggest `/verify specs/<slug>.md` as the next step. Do not push, open a PR or
merge; that happens after verification.
