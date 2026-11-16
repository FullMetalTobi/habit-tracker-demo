---
name: verify
description: Verify an implementation against its spec. Checks every acceptance criterion, runs the gates, gets a fresh subagent review, walks the criteria in a real browser with Playwright, and writes a verification report. Optionally opens a draft PR.
argument-hint: "[specs/<slug>.md] [--pr]"
disable-model-invocation: true
---

# Verify

Verify the implementation of: **$ARGUMENTS**

You check, you do not build. Do not fix anything in this skill. Findings go to the
report, and fixes go back to `/code`.

## 1. Load

- Read the spec (if the argument is empty, use the spec in `specs/` that matches the
  current branch, or ask).
- Collect the diff: `git diff main...HEAD --stat` and `git log main..HEAD --oneline`.

## 2. Spec against implementation

For **every** acceptance criterion and every Must requirement, find the code and the
test that prove it. Record per criterion: `met`, `partly met`, or `not met`, with the
file and test as evidence. Also flag scope creep: changes the spec did not ask for.

## 3. Gates

Run them and record the result and the duration of each:

```bash
npm run lint
npm run typecheck
npm test
PORT=3110 E2E_PORT=3110 npm run test:e2e
```

Never use port 3000 (the Playwright default). `PORT` is the port the app listens on,
`E2E_PORT` the one Playwright waits for, so set both to the same free port. If 3110 is
taken, pick another free port.

A red gate is a blocking finding.

## 4. Fresh review

Start a **new** subagent with the Agent tool so the review is not anchored on your own
view. Give it only the spec path and the branch, not your conclusions. Ask it to review
`git diff main...HEAD` for bugs, missed edge cases (empty states, reload, old data and
backups, mobile), violated ADRs in `docs/adr/`, and missing tests, and to return a
list of findings with file, line and severity. Check each finding yourself before you
put it in the report.

## 5. Browser walk

Walk each user-facing acceptance criterion in a real browser, like a user would.

1. Start the app: `PORT=3110 npm run dev` in the background and wait until
   `http://localhost:3110` answers. Never use port 3000.
2. Drive it with Playwright: use `playwright-cli` if it is installed
   (`playwright-cli open http://localhost:3110`, then `snapshot`, `click`, `fill`,
   `console`), otherwise a Playwright MCP or browser tool if one is available.
3. Log in on `/login`; load demo data or create the habits the criterion needs.
4. For every criterion: do the steps from the verification plan, check the result,
   then **reload** and check again. Check the browser console for errors.
5. Look at the affected screens at 1280x800 and at 390x844 (mobile bottom nav).
6. Take a screenshot as evidence for each criterion.
7. Close the browser and stop the dev server when you are done. A dev server left
   running on 3110 would be reused by the next `test:e2e` run instead of the build.

If no browser can be started, say so in the report. Never mark a criterion as
verified in the browser when you only read the code.

## 6. Report

Write `specs/<slug>.verification.md` and show it to the user:

```markdown
# Verification: <Title>

Branch: <branch> @ <sha>  ·  Verdict: Pass | Issues found

## Acceptance criteria
| AC | Code + test | Browser | Result |

## Gates
| Gate | Result | Duration |

## Review findings
### Blocking
### Non-blocking

## Not verified
What you could not check, and why.
```

## 7. Optional draft PR

Only if the user passed `--pr` or asks for it, the verdict is Pass, and the spec names
an issue:

```bash
git push -u origin HEAD
gh pr create --draft --title "<type>: <title>" --body-file <body>
```

The body has `Closes #<n>`, a short summary, and the verification report. Never
merge. Never open a PR with a red gate.
