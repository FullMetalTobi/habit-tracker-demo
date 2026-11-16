---
name: verify
description: Verify an implementation against its spec. Runs lint, typecheck and unit tests and writes a verification report.
argument-hint: "[specs/<slug>.md]"
disable-model-invocation: true
---

# Verify

Verify the implementation of: **$ARGUMENTS**

You check, you do not build. Do not fix anything in this skill. Findings go to the
report, and fixes go back to `/code`.

## Load

- Read the spec (if the argument is empty, use the spec in `specs/` that matches the
  current branch, or ask).
- Collect the diff: `git diff main...HEAD --stat` and `git log main..HEAD --oneline`.

## Gates

Run them and record the result, the test counts and the duration of each:

```bash
npm run lint
npm run typecheck
npm test
```

A red gate is a blocking finding. Never rerun a failing test until it passes by luck;
report it.

## Report

Write `specs/<slug>.verification.md` and show it to the user:

```markdown
# Verification: <Title>

Branch: <branch> @ <sha>  ·  Verdict: Pass | Issues found

## Gates
| Gate | Result | Duration |

## Not verified
What you could not check, and why.
```

The verdict is **Pass** only when
- every gate is green.

Commit only the report: `docs(spec): add verification report for <slug>`.
