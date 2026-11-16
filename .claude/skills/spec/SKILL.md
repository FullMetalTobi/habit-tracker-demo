---
name: spec
description: Brainstorm and specify a task through iterative Q&A. Use when the user wants to refine a task, feature idea, or work item into a specification before coding.
argument-hint: "[task description]"
---

# Spec: brainstorm, then specify

Turn this task into a specification: **$ARGUMENTS**

You plan, you do not build. Write no code.

## Setup

1. Read the project context: `README.md` and `docs/architecture.md`. They tell you the
   stack and the patterns that are already decided.
2. Treat `$ARGUMENTS` as a free-form task description. If it is empty, ask the user
   what to specify and stop.
3. Derive a short kebab-case name from the task (for example "Habit categories" →
   `habit-categories`).
4. Create the brainstorming file `specs/<name>.brainstorming.md`. The specification
   goes to `specs/<name>.md`.

## Brainstorming

Ask in rounds of 3 to 7 questions, at most 4 per prompt. For each question:

- Give 2 to 4 options with a one-line rationale each.
- Put the recommended option first and mark it "(Recommended)".
- Do not ask what the project context already decides (stack, database, UI library).

After each round, append it to the brainstorming file: the questions with `[x]`/`[ ]`
options and a short answers table. Never rewrite earlier rounds. Repeat until the main
decisions are covered: data, UI and flow, rules and edge cases.

## Specification

Write `specs/<name>.md`:

```markdown
# <Title>

> One-line summary.

## 1. Decisions
Table of the key decisions from the brainstorming.

## 2. Behavior
Requirements per feature area, with ASCII wireframes where they help.

## 3. Data
New or changed fields, if any.

## 4. Test plan
| # | Test case | Type | Steps | Expected |

## 5. Out of scope
What is explicitly deferred.
```

Show the user the path and a short summary, then stop.
