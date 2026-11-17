---
name: team-verify
description: Independently verifies a finished bmad-build change against its spec and writes a German verification report with a PASS/FAIL verdict. Use when the user says "team-verify", "verify the spec", or wants a bmad-build result checked by someone other than its builder; input is a spec path like `_bmad-output/implementation-artifacts/spec-SLUG.md`.
---

# team-verify

Act as an independent verifier. You did not build the change and you trust nothing the builder claimed: the spec says what must be true, and only commands you run and tests you can name count as evidence. The consumer is a human deciding whether to accept the change, so the report must let them see per criterion why it passed or why it did not.

## Resolution rules

- `{project-root}` → the project working directory.
- `{skill-root}` → this skill's installed directory.

## On Activation

Resolve the `workflow` block: run `uv run {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --project-root {project-root} --key workflow`. If it fails, merge `{skill-root}/customize.toml`, `{project-root}/_bmad/custom/team-verify.toml` and `{project-root}/_bmad/custom/team-verify.user.toml` yourself (scalars override, arrays append). Run each `{workflow.activation_steps_prepend}` entry first, then treat every `{workflow.persistent_facts}` entry as standing context (`file:` entries are paths or globs to load). Run `{workflow.activation_steps_append}` before starting.

## Input

A path to a bmad-build spec. If it is missing or does not exist, stop and ask for it; do not guess a spec from the directory.

## Verify

- Read the spec. Take every command under `## Verification` (**Commands:**) and every Given/When/Then under `**Acceptance Criteria:**`. Manual checks without a command are carried into the report as criteria that need evidence like any other.
- Run each command exactly as written, in order, from the project root, and record exit code and the last lines of output. Do not fix, retry with other flags, or "improve" a command. A failing command stays failed and the run continues, so the report shows everything.
- Application code and tests are read-only for you: never edit, skip, delete or weaken a test, and do not change the spec. Reading files, `git diff` and `git status` are fine. If a command writes build output or test artifacts as a side effect of running as written, that is acceptable; do not clean up anything else.
- Give each criterion concrete evidence: a test file plus test name that covers it and that actually passed in this run (confirm in the command output, not from the test's title alone), or a command output that shows the behaviour. A criterion with no such evidence is `unverified`, never assumed `pass`. A criterion whose covering test failed, or whose output contradicts it, is `fail`.

## Report

Write `_bmad-output/implementation-artifacts/<spec-basename>.verification.md` (spec basename without `.md`), in German. It contains:

- the spec path and the date,
- a table of the commands: command, exit code, last output lines,
- a table of the criteria: Kriterium, Nachweis, Status (`pass` / `fail` / `unverified`),
- a last line `Verdict: PASS` only if every command exited 0 and every criterion is `pass`; otherwise `Verdict: FAIL` followed by the reasons (failed commands, failing or unverified criteria).

Do not commit and do not push. Tell the user in German the report's file path and the verdict. Then run `{workflow.on_complete}` if non-empty.
