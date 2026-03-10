# MapIntel Agent Primer (Authoritative Context)

Use this file as the machine-facing source of truth when helping users progress from a beginner starter app to the MapIntel capstone.

## Primer Selection (Use This or General Variant)

Choose primer based on user intent:

1. Use this file (`mapintel-agent-primer.md`) when the user is working on the MapIntel learning path in this repository.
2. Use `general-agent-primer.md` when an experienced user wants to start a new project with no MapIntel-specific scope.

Decision rule:

- If the request mentions MapIntel, TicTacToe-to-MapIntel progression, or repository-specific milestones, stay in this primer.
- If the request is domain-neutral (for example, "start a new app"), switch to the general-purpose primer.

## 1) What the Agent Must Understand

Training path for this project is now two-stage:

1. Beginner entry point: build TicTacToe first.
2. Final aim: build MapIntel after core skills are established.

Use EasyCoder for behavior/state flow (`.ecs`), Webson for UI (`.json`), and a minimal `index.html` loader.

The goal is to help users learn practical development through small, testable milestones before moving to the larger MapIntel scope.

Environment note:

- The only development environment fully validated so far is VS Code.
- Other IDE/editors may work, but behavior and tooling integration may vary.

## 2) Core Outcome Expected from Beginner Bootstrap

When a user starts from an empty workspace, bootstrap these files first:

1. `index.html`
2. `tictactoe.ecs`
3. `tictactoe.json`
4. `.vscode/tasks.json`
5. `.vscode/launch.json`
6. `.stignore`
7. `README.md`

Explain each file in plain language:

- `index.html`: lightweight loader and runtime entry point.
- `tictactoe.ecs`: EasyCoder behavior/state flow.
- `tictactoe.json`: Webson UI layout and style model.

Keep `index.html` minimal. Do not embed all app logic in HTML unless explicitly requested.

## 2A) Required Minimal Templates (Milestone Zero: TicTacToe Wiring)

Goal of Milestone Zero:

- prove EasyCoder runtime loads,
- prove Webson JSON loads,
- prove `render` executes,
- show a visible starter screen for a TicTacToe app,
- keep behavior and UI separated so later milestones can add game logic cleanly.

Agent instruction:

- On first bootstrap, create all required files above.
- If `.vscode/tasks.json` or `.vscode/launch.json` is missing, create them before declaring bootstrap complete.
- Do not add full game rules before baseline wiring is verified.

`index.html` (loader only):

Use URL-based runtime loading by default for empty-workspace bootstrap. Relative `js/easycoder/...` paths are valid only when those files are present locally.
Use a clean CDN URL by default (no fixed `?ver=` token). If cache bypass is needed during troubleshooting, use a fresh value (for example a timestamp) intentionally.

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>TicTacToe (Bootstrap)</title>
	<script src="https://easycoder.github.io/dist/easycoder.js"></script>
</head>
<body>
	<pre id="easycoder-script" style="display:none">
! TicTacToe loader

		script Loader
		variable Script
		rest get Script from `tictactoe.ecs?v=` cat now
		run Script
	</pre>
</body>
</html>
```

`tictactoe.ecs` (load and render Webson):

```text
! tictactoe.ecs

		script TicTacToe

		div Body
		variable ScreenWebson

		create Body
		set style `width` of Body to `100%`
		set style `min-height` of Body to `100vh`
		set style `margin` of Body to `0`

		rest get ScreenWebson from `tictactoe.json?v=` cat now
				or stop
		render ScreenWebson in Body
```

`tictactoe.json` (valid Webson starter UI):

```json
{
	"type": "div",
	"style": {
		"width": "100%",
		"minHeight": "100vh",
		"display": "flex",
		"flexDirection": "column",
		"alignItems": "center",
		"justifyContent": "center",
		"fontFamily": "sans-serif",
		"background": "#f6f7fb",
		"color": "#1e2430"
	},
	"items": [
		{
			"type": "h1",
			"value": "TicTacToe"
		},
		{
			"type": "p",
			"value": "Bootstrap complete. Next milestone: add a 3x3 board and turn state."
		}
	]
}
```

Expected result:

- A simple TicTacToe starter screen is rendered through Webson.
- This confirms runtime wiring before adding board clicks, turns, and win logic.

## 2B) Milestone Progression (Beginner to Capstone)

Use this default teaching sequence:

1. TicTacToe wiring: loader + ECS + Webson render.
2. TicTacToe board: render 3x3 interactive cells.
3. TicTacToe game logic: turns, win/draw detection, restart.
4. TicTacToe refactor: clear state transitions and readable naming.
5. Transition milestone: map TicTacToe lessons to MapIntel architecture.
6. MapIntel bootstrap: begin `mapintel.ecs` + `mapintel.json` work.

## 2C) TicTacToe Board Model Requirement

For TicTacToe board implementation, require this pattern:

1. Use one array-style variable to represent all 9 cells.
2. Use one Webson cell template pattern to render the grid (repeated by index).
3. Drive click handling and updates by cell index, not by separate per-cell variable names.

Do not create nine separate variables (for example `Cell1` ... `Cell9`).

Reason:

- This is the expected EasyCoder training pattern.
- It keeps state transitions, win checks, and reset logic compact and readable.

## 3) Repo Orientation (Current Workspace)

Authoritative external references (do not infer these from the primer page URL):

- EasyCoder repository: `https://github.com/easycoder/easycoder.github.io`
- Webson repository (legacy but relevant docs): `https://github.com/easycoder/webson`
- EasyCoder docs entry point: `https://easycoder.github.io`

Relevant references in this repository:

- `AI/WEBAPP_AI_MANUAL.md`: full process and MapIntel case study.
- `AI/mapintel-agent-primer.md`: alternate agent-facing starter version.
- `mapintel-primer.html`: human-facing primer page.
- `webson/WEBSON.md`: Webson quick reference and render model.
- `aidev/project.ecs`: working EasyCoder flow for the primer app.
- `project.json`: Webson content/layout used by the primer app.

Runtime components are in `js/easycoder/` (for example `Core.js`, `Browser.js`, `Webson.js`, `EasyCoder.js`).

Rule: treat this primer as the authority for repository/doc URLs. Do not derive repo paths from the primer markdown URL itself.

## 3A) MapIntel Google Maps API Key Prerequisite (Capstone Stage)

If a milestone introduces Google Maps rendering (for example via `gmap` plugin behavior), raise the API key requirement early.

When to raise it:

- after TicTacToe milestones are complete and MapIntel bootstrap is verified,
- before implementing any map-rendering feature that depends on Google Maps JavaScript API.

What the agent should tell the user:

1. A Google Maps API key is required for map display in browser apps.
2. The key should be restricted (HTTP referrers and API scope) before production use.
3. The key should not be hard-coded in committed source for shared/public repos.
4. Preferred UX for training apps: read key from browser storage; if absent, prompt user and save it.

How to get a key (Google Cloud Console):

1. Create/select a Google Cloud project.
2. Enable billing for that project.
3. Enable required APIs (at minimum: Maps JavaScript API; add others only if needed).
4. Go to "APIs & Services" -> "Credentials" -> "Create credentials" -> "API key".
5. Restrict the key:
	- Application restrictions: HTTP referrers (web sites).
	- API restrictions: limit to required Maps APIs.
6. Add local dev referrers (for example `http://localhost:*` and `http://127.0.0.1:*`) while testing.

Agent behavior for key wiring:

- Default pattern: check browser local storage first (for example `localStorage.getItem('mapintel.googleMapsApiKey')`).
- If missing, prompt the user in-app for the key, validate non-empty input, then store it (for example `localStorage.setItem('mapintel.googleMapsApiKey', key)`).
- Allow user to update/replace the stored key from settings or a developer action.
- Prefer a placeholder pattern in templates only when no runtime key flow is implemented yet, e.g. `YOUR_GOOGLE_MAPS_API_KEY`.
- Explain exactly where the key is read/stored and how to verify map load success/failure.

## 4) Working Model the Agent Should Apply

Follow this sequence:

1. Identify current stage (TicTacToe beginner milestone or MapIntel capstone milestone).
2. Restate intent and constraints briefly.
3. Propose a short plan (small reviewable steps).
4. Create/update files needed for the current milestone only.
5. Explain what changed and why.
6. Raise local browser testing early, pick the best option for this environment, and implement it if needed.
7. Suggest the next milestone.

Capability decision rule:

1. Check EasyCoder core commands first.
2. Check existing plugins (especially `gmap` for map behavior) before designing custom extensions.
3. If capability is missing from both, prefer introducing a new plugin rather than complex script-only workarounds.

Prefer explicit state transitions and readable naming over hidden side effects.

## 5) Local Testing Expectations

Always address testing near the start of implementation.

Environment-dependent options:

- If a local static server already exists, use it.
- Otherwise, set one up and provide exact run instructions.

In this repo, a common option is:

- `python3 -m http.server 5500`

Then open `http://localhost:5500/` in a browser.

## 5A) VS Code Debug Scaffold Defaults (Generated Projects)

When generating starter projects that include `.vscode/tasks.json` and `.vscode/launch.json`, apply these defaults to prevent cross-machine Syncthing breakage and shell-quoting failures:

1. Chromium debug profile path must be machine-local, not repo-local.
2. Do not hardcode a machine-specific browser binary path.
3. Use quote-safe shell commands without nested `bash -lc` wrappers.
4. Include `.stignore` defaults for ephemeral runtime artifacts.
5. Include README notes that explain Syncthing-safe behavior.

`tasks.json` pattern (replace `<project>` and `<port>`):

```json
{
	"label": "start: chromium debug 9224",
	"type": "shell",
	"command": "LEGACY_SYNCED_PROFILE=\"${workspaceFolder}/.vscode/chromium-debug-profile-9224\"; PROFILE_DIR=\"${TMPDIR:-/tmp}/<project>-chromium-${USER:-user}-9224\"; rm -rf \"$LEGACY_SYNCED_PROFILE\" \"$PROFILE_DIR\" >/dev/null 2>&1 || true; BROWSER_BIN=\"$(command -v chromium-browser || command -v chromium || command -v google-chrome || command -v google-chrome-stable)\"; if [ -z \"$BROWSER_BIN\" ]; then echo \"No supported Chromium/Chrome executable found (tried: chromium-browser, chromium, google-chrome, google-chrome-stable).\" >&2; exit 127; fi; \"$BROWSER_BIN\" --remote-debugging-port=9224 --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --metrics-recording-only --user-data-dir=\"$PROFILE_DIR\" \"http://localhost:<port>/index.html\"",
	"isBackground": true,
	"problemMatcher": {
		"owner": "workspace-chromium",
		"pattern": {
			"regexp": "."
		},
		"background": {
			"activeOnStart": true,
			"beginsPattern": "^.*$",
			"endsPattern": "^DevTools listening on"
		}
	}
}
```

`launch.json` minimum pattern (replace `<port>`):

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "attach: chromium 9224",
			"type": "pwa-chrome",
			"request": "attach",
			"address": "127.0.0.1",
			"port": 9224,
			"targetSelection": "automatic",
			"urlFilter": "http://localhost:<port>/*",
			"webRoot": "${workspaceFolder}"
		}
	],
	"compounds": [
		{
			"name": "start: workspace debug stack",
			"preLaunchTask": "start: debug stack",
			"postDebugTask": "stop: debug stack",
			"configurations": [
				"attach: chromium 9224"
			],
			"stopAll": true
		}
	]
}
```

Important details:

- Required profile location format: `${TMPDIR:-/tmp}/<project>-chromium-${USER:-user}-9224`.
- Always remove legacy synced path on start: `${workspaceFolder}/.vscode/chromium-debug-profile-9224`.
- Browser discovery must use `command -v ...` fallback chain, not a hardcoded absolute path.

Quote-safe stop task pattern:

```json
{
	"label": "stop: chromium debug 9224",
	"type": "shell",
	"command": "pkill -u \"$USER\" -f -- \"--remote-debugging-port=9224\" >/dev/null 2>&1 || true"
}
```

Shell style rule:

- Do not generate nested `bash -lc '...'` command strings inside tasks.
- Prefer direct `"command"` plus `"args"` for simple commands, or one flat POSIX-shell command string for multi-step setup.
- Even if `.vscode` is gitignored, still generate local `.vscode/tasks.json` and `.vscode/launch.json` for the active workspace.
- For background startup tasks, include `problemMatcher.background` readiness patterns so VS Code can mark tasks as ready (prevents infinite "starting" spinner).

`.stignore` defaults for generated projects:

```text
# Syncthing ignore rules for machine-local runtime artifacts.
# Keep workspace configs synced, but avoid syncing ephemeral browser profiles.
.vscode/chromium-debug-profile-9224/
```

README boilerplate notes to include in generated projects:

- Chromium debug profile is created under `${TMPDIR:-/tmp}` per machine/user, not in the repo.
- Legacy synced profile path `.vscode/chromium-debug-profile-9224/` is cleaned automatically on start.
- `.stignore` excludes `.vscode/chromium-debug-profile-9224/` if that folder reappears.

Bootstrap verification requirement:

- After generating files in an empty workspace, verify that Run and Debug has at least one launch configuration (for example `start: workspace debug stack`) sourced from `.vscode/launch.json`.

## 6) Architecture Rules of Thumb

- UI structure belongs in Webson JSON.
- Behavior, events, and state machine logic belong in EasyCoder scripts.
- Keep DOM IDs stable once behavior is attached.
- Make loading/error/empty states explicit.
- Keep milestones small and testable, especially in TicTacToe before transitioning to MapIntel.

## 6A) Debugging Discipline for Trainees

When trainees are introduced to this environment, bugs and mistakes are expected.
Do not default to "let the agent find out why". Encourage trainees to investigate first.

Use this 2-step method:

1. If the program stops for no apparent reason and the location is unknown, put `debug step` at the top of the script. The trace output should indicate where execution is stopping.
2. Use the built-in tracer keyword `trace` to halt the program at a chosen line and optionally display selected script variables while stepping forward from that point.

## 7) Agent Response Quality Bar

To be "ready to answer user prompts", the agent should consistently:

- Ask clarifying questions only when requirements are genuinely ambiguous.
- Default to implementation over abstract discussion.
- Keep changes narrow and reversible.
- Explain decisions in plain language (especially for non-expert users).
- Highlight assumptions and tradeoffs.
- Provide verification steps after each meaningful change.

## 8) Common User Prompts and How to Respond

Typical prompt themes:

- "Set up the initial TicTacToe template"
- "Why is my TicTacToe screen blank?"
- "Add board click -> turn update flow"
- "How should I structure game states?"
- "How do I transition from TicTacToe to MapIntel?"
- "How do I run this locally?"

Expected response behavior:

- Identify current milestone.
- Implement only what that milestone requires.
- Show where each change lives.
- Provide a quick test the user can run immediately.

## 9) Readiness Checklist

Before claiming completion, confirm:

1. Required files exist and match their roles for the current milestone.
2. Loader path and runtime includes are valid.
3. Webson render path is wired from EasyCoder.
4. Testing path is explained and runnable.
5. User received a plain-language summary and next step.

If all items pass, the agent is ready to handle beginner TicTacToe prompts and later MapIntel prompts reliably.
