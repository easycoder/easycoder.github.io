# General Agent Primer (Experienced User Variant)

Use this file when an experienced user wants to start a new project and the target application is not predefined.

## 1) Purpose

Provide a stack-aware but domain-neutral workflow that can bootstrap almost any app in small, testable milestones.

## 2) Intake: Establish Scope First

Before writing code, capture these minimum constraints:

1. App goal and primary user.
2. Target platform (web, mobile web, desktop, CLI, service).
3. Preferred stack and runtime constraints.
4. Must-have features for Milestone 1.
5. Success criteria and how the user will verify them.

If the user does not provide all details, make the smallest safe assumptions and state them explicitly.

## 3) Default Bootstrap Pattern

For a new project, create only what Milestone 1 needs:

1. Minimal entry point.
2. Minimal behavior/state file(s).
3. Minimal UI/config/data file(s), if applicable.
4. Short README with run/test steps.

Do not front-load architecture or optional features.

## 4) Milestone-First Delivery

Use short, reviewable milestones:

1. Runtime wiring works.
2. One visible/useful behavior works.
3. Basic error handling works.
4. First acceptance check passes.

After each milestone:

- explain what changed,
- show how to run it,
- show how to verify it,
- propose the next smallest step.

## 5) Testing Expectations

Raise testing early and keep it concrete:

- If tests exist, run the relevant subset after changes.
- If no tests exist, provide a manual verification checklist.
- Prefer fast local verification loops over broad unscoped testing.

## 6) Debugging Discipline (Teach Investigation)

Do not default to "let the agent find out why". Encourage the user to investigate first.

Use this 2-step flow in EasyCoder scripts:

1. If execution stops and location is unknown, put `debug step` at the top of the script and inspect the resulting trace.
2. Use `trace` to halt at a chosen line and optionally display selected variables while stepping.

For non-EasyCoder stacks, use the equivalent step/trace debugger pattern and keep the same investigation mindset.

## 6A) EasyCoder Loop Syntax Guard

When generating EasyCoder loops:

1. Use `while <condition>` followed by `begin`.
2. Close loop blocks with `end`.
3. Do not emit `end while`.

## 6B) Webson ID Syntax Guard

When generating Webson JSON:

1. Use `@id` for element IDs.
2. Do not emit plain `id` for Webson directive-style IDs.

## 6C) EasyCoder Event-Handler Guard

When generating EasyCoder interaction logic for repeated elements:

1. Attach repeated elements through an array variable.
2. Use one array event handler (for example `on click Cell`).
3. Use `the index of <array>` in the handler to identify the triggered item.
4. Enforce turn/state guards in the handler to ignore events when interaction is not allowed.

## 6D) EasyCoder Array Access Guard

When generating EasyCoder array logic:

1. Set active element via `index Array to N`.
2. Read/write through the array variable name after indexing.
3. Do not emit pseudo-syntax such as `put element N of Array into Value`.

## 7) Agent Working Model

For each request:

1. Restate intent and constraints briefly.
2. Propose a short plan.
3. Implement only current milestone scope.
4. Verify with tests or a manual check.
5. Summarize decisions and tradeoffs in plain language.
6. Suggest the next milestone.

## 8) Escalation to Specialized Primers

If requirements become domain-specific, switch to the matching specialized primer.

Examples:

- MapIntel learning path -> `mapintel-agent-primer.md`
- Other project-specific workflows -> corresponding project primer

## 9) Completion Checklist

Before claiming completion, confirm:

1. The milestone goal is met.
2. Run/test instructions are accurate.
3. Verification steps are provided and repeatable.
4. Assumptions and open risks are explicit.
