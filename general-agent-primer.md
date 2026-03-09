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

If Milestone 1 includes browser debugging in VS Code, also create:

1. `.vscode/tasks.json`
2. `.vscode/launch.json`
3. `.stignore`

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

## 5A) Generated VS Code Scaffolding Rules

When scaffolding `.vscode/tasks.json` and `.vscode/launch.json` for browser-debug workflows, use these defaults:

1. Keep Chromium profile machine-local, not repository-local.
2. Avoid hardcoded machine-specific browser paths.
3. Avoid nested `bash -lc` quoting.
4. Add `.stignore` entries for ephemeral runtime artifacts.
5. Include short README notes about Syncthing-safe behavior.

Required profile path format:

- `${TMPDIR:-/tmp}/<project>-chromium-${USER:-user}-9224`

Required start behavior:

- On start, remove legacy synced profile path: `${workspaceFolder}/.vscode/chromium-debug-profile-9224`.
- Resolve browser executable with `command -v` fallback chain (for example: `chromium-browser`, `chromium`, `google-chrome`, `google-chrome-stable`).

Required launch behavior:

- Generate `.vscode/launch.json` with an attach config on port `9224` and a compound entry that uses `preLaunchTask: start: debug stack` and `postDebugTask: stop: debug stack`.
- Do not hardcode browser executable path in launch config.
- Even if `.vscode` is gitignored, still create local `.vscode/tasks.json` and `.vscode/launch.json`.

Quote-safe stop pattern:

```json
{
	"label": "stop: chromium debug 9224",
	"type": "shell",
	"command": "pkill -u \"$USER\" -f -- \"--remote-debugging-port=9224\" >/dev/null 2>&1 || true"
}
```

Shell command style:

- For simple commands, prefer `command` + `args` (for example `python3 -m http.server <port>`).
- For multi-step startup commands, use one flat shell command string.
- Do not wrap task commands inside nested `bash -lc '...'` strings.

Default `.stignore` snippet:

```text
# Syncthing ignore rules for machine-local runtime artifacts.
# Keep workspace configs synced, but avoid syncing ephemeral browser profiles.
.vscode/chromium-debug-profile-9224/
```

Default README notes:

- Chromium debug profile is created under `${TMPDIR:-/tmp}` per machine/user, not in the repo.
- Legacy synced profile path `.vscode/chromium-debug-profile-9224/` is cleaned automatically on start.
- `.stignore` excludes `.vscode/chromium-debug-profile-9224/` if that folder reappears.

Completion check for empty-workspace scaffolds:

- Do not declare setup complete until `.vscode/launch.json` exists and Run and Debug shows at least one launch target sourced from it.

## 6) Debugging Discipline (Teach Investigation)

Do not default to "let the agent find out why". Encourage the user to investigate first.

Use this 2-step flow in EasyCoder scripts:

1. If execution stops and location is unknown, put `debug step` at the top of the script and inspect the resulting trace.
2. Use `trace` to halt at a chosen line and optionally display selected variables while stepping.

For non-EasyCoder stacks, use the equivalent step/trace debugger pattern and keep the same investigation mindset.

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
