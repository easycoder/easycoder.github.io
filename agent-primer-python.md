# EasyCoder Python Primer (Outline)

Use this primer when building EasyCoder applications that run on the Python CLI runtime (`easycoder-py`).

## 1) Purpose

Establish a safe, milestone-first workflow for Python EasyCoder scripts, with strict syntax discipline and explicit verification.

## 2) Working Rules

- Ask rather than guess when syntax is uncertain.
- Implement the smallest working step first.
- Keep changes minimal and reversible.
- Explain what changed and how to verify it.

## 3) Runtime Setup

Install and run:

```bash
pip install -U easycoder
```

Run script:

```bash
easycoder project.ecs
```

If `easycoder` is not on `PATH`, use full path (often under `~/.local/bin`).

## 4) Script Structure Baseline

Use this starter shape:

```text
!   project.ecs

    script Project

    variable Message
    put `Hello, world!` into Message
    log Message
    exit
```

## 5) Syntax Guardrails

- Declare variables one per line.
- Declare before use.
- Use `while ... begin ... end` loops.
- Avoid invented forms (`define`, `function`, `end while`, `endif`, etc.).
- Prefer `put ... into ...` assignment.
- For reusable logic, use labels + `gosub` + `return`.

## 6) Conditions and Membership

- Use canonical comparisons (`is`, `is not`, `is greater than`, `is less than`, etc.).
- Membership checks use `includes`, for example:

```text
if Vowels includes Ch
begin
    add 1 to Count
end
```

## 7) Strings and Data

Before writing string-heavy logic, confirm canonical commands for:

1. length
2. character access
3. membership checks

For JSON/data access, use built-in EasyCoder JSON commands and verify with small sample data first.

## 8) Debugging

Use built-in tracing early:

```text
debug step
trace
```

- Keep trace points near state transitions.
- Verify expected variable values before adding more logic.

## 9) Milestone Delivery Pattern

For each request:

1. Restate goal.
2. Ask only for missing constraints.
3. Implement current milestone only.
4. Show run/test steps.
5. Provide next smallest step.

## 10) If Project Uses Both JS and Python EasyCoder

- Flag potential runtime differences before coding.
- Prefer conformance-safe syntax shared across both runtimes.
- Keep behavior parity explicit in test notes.
