---
name: verify
description: Verify an implementation against its spec. Checks every acceptance criterion, runs the gates, gets a review from a fresh reviewer subagent and writes a verification report.
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

## Spec against implementation

For **every** acceptance criterion and every Must requirement, find the code and the
test that prove it. Record per criterion: `met`, `partly met`, or `not met`, with the
file and the test name as evidence. A criterion without a test is at most `partly met`.
Also flag scope creep: changes the spec did not ask for.

## Gates

Run them and record the result, the test counts and the duration of each:

```bash
npm run lint
npm run typecheck
npm test
PORT=3110 E2E_PORT=3110 npm run test:e2e
```

The e2e run builds the app, serves it and drives it with Playwright. Never use port
3000 (the Playwright default). `PORT` is the port the app listens on, `E2E_PORT` the
one Playwright waits for, so set both to the same free port. If 3110 is taken, pick
another free port. A dev server already running on that port would be reused instead
of the build, so stop it first.

A red gate is a blocking finding. Never rerun a failing test until it passes by luck;
report it.

## Fresh review

Start the **reviewer** subagent (`.claude/agents/reviewer.md`) with the Agent tool. It
begins with an empty context, so the review is not anchored on your own view. Give it
only the spec path and the branch, not your conclusions. It reviews
`git diff main...HEAD` and returns findings with file, line and severity. Check each
finding yourself in the code before you put it in the report, and drop the ones that
do not hold.

## Report

Write `specs/<slug>.verification.md` and show it to the user:

```markdown
# Verification: <Title>

Branch: <branch> @ <sha>  ·  Verdict: Pass | Issues found

## Acceptance criteria
| AC | Code + test | Result |

## Gates
| Gate | Result | Duration |

## Review findings
### Blocking
### Non-blocking

## Not verified
What you could not check, and why.
```

The verdict is **Pass** only when
- every gate is green,
- every acceptance criterion is `met`,
- no blocking review finding is open.

Commit only the report: `docs(spec): add verification report for <slug>`.
