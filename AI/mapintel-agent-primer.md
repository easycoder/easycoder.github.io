# MapIntel Agent Primer (TicTacToe First)

Use this document as the setup authority for the learning path:

1. Beginner stage: TicTacToe.
2. Capstone stage: MapIntel.

## Purpose

Start with a small, complete EasyCoder + Webson app (TicTacToe) so trainees learn runtime wiring, state transitions, and debugging discipline before entering the larger MapIntel scope.

Environment note:

- The only development environment fully validated so far is VS Code.
- Other IDE/editors may work, but behavior and tooling integration may vary.

## Bootstrap actions (Beginner)

1. Start from an empty workspace.
2. Create initial files:
   - `index.html` (loader/entry page)
   - `tictactoe.ecs` (EasyCoder behavior script)
   - `tictactoe.json` (Webson layout/styling)
   - `.vscode/tasks.json`
   - `.vscode/launch.json`
   - `.stignore`
   - `README.md`
3. Keep `index.html` as a loader (do not embed the full app logic there).
4. Explain each file briefly after creation.
5. Verify local browser run before adding game logic.
6. Verify Run and Debug shows at least one launch config from `.vscode/launch.json`.

## Default milestone sequence

1. TicTacToe wiring (`render` confirmed).
2. 3x3 board rendering and click handling, using one array-style variable plus one repeated Webson cell template (do not create nine cell variables).
3. Turn logic, win/draw detection, reset flow.
4. Refactor for readable state/event structure.
5. Transition to MapIntel bootstrap and then map-specific features.

## Debugging discipline for trainees

Do not default to "let the agent find out why". Ask trainees to investigate first.

1. If the program stops and the location is unknown, put `debug step` at the top of the script and use the resulting trace to locate the stop point.
2. Use `trace` to halt at a chosen line and optionally display variables while stepping.

## EasyCoder loop syntax guard

1. Use `while <condition>` then `begin`.
2. Close loop blocks with `end`.
3. Never generate `end while`.

## Webson ID guard

1. Use `@id` for element IDs in Webson JSON.
2. Never generate plain `id` when defining Webson element IDs.

## Working style

- Work in small, reviewable steps.
- Summarize each change.
- If requirements are unclear, ask a clarifying question.
- Proactively suggest the next milestone.

## Local browser testing

- Raise local testing early.
- Choose an approach based on the current environment.
- If a helper is needed, create one (for example `serve.py`) and explain exactly how to run it.

## Map features and capability checks

- Google Maps features require a Google Maps API key/token; raise this prerequisite before implementing map rendering.
- Do not hard-code production keys in committed source.
- For requested special functionality, check EasyCoder core and existing plugins first.
- If capability is missing from both, prefer a new plugin rather than complex script-level workarounds.

## VS Code debug scaffold defaults (generated projects)

When generating starter projects that include `.vscode/tasks.json` and `.vscode/launch.json`, apply these defaults to avoid Syncthing cross-machine breakage and shell quoting failures:

1. Use a machine-local Chromium profile, never a repo-local profile.
2. Detect browser executable dynamically (no hardcoded absolute path).
3. Avoid nested `bash -lc` quoting patterns in tasks.
4. Add `.stignore` ignore rules for ephemeral runtime artifacts.
5. Add README notes describing Syncthing-safe behavior.

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

Required behavior:

- Profile path format: `${TMPDIR:-/tmp}/<project>-chromium-${USER:-user}-9224`.
- Cleanup on start: `${workspaceFolder}/.vscode/chromium-debug-profile-9224`.
- Browser executable lookup: `command -v chromium-browser || command -v chromium || command -v google-chrome || command -v google-chrome-stable`.

Quote-safe stop task:

```json
{
   "label": "stop: chromium debug 9224",
   "type": "shell",
   "command": "pkill -u \"$USER\" -f -- \"--remote-debugging-port=9224\" >/dev/null 2>&1 || true"
}
```

Shell style:

- Do not generate nested `bash -lc '...'` wrappers.
- Use direct `command` + `args` for simple tasks, or one flat shell command for multi-step startup.
- Even if `.vscode` is gitignored, still create local `.vscode/tasks.json` and `.vscode/launch.json` for the workspace.
- For background startup tasks, include `problemMatcher.background` readiness patterns so VS Code does not stay stuck in "starting".

`.stignore` default:

```text
# Syncthing ignore rules for machine-local runtime artifacts.
# Keep workspace configs synced, but avoid syncing ephemeral browser profiles.
.vscode/chromium-debug-profile-9224/
```

README notes to include:

- Chromium debug profile is created under `${TMPDIR:-/tmp}` per machine/user, not in the repo.
- Legacy synced profile path `.vscode/chromium-debug-profile-9224/` is cleaned automatically on start.
- `.stignore` excludes `.vscode/chromium-debug-profile-9224/` if that folder reappears.

Completion rule for empty-workspace bootstrap:

- Do not mark bootstrap complete until `.vscode/tasks.json` and `.vscode/launch.json` exist and provide a visible Run and Debug target.

## Context paths (fill for your environment)

- EasyCoder location: `<EASYCODER_PATH>`
- Webson location/docs: `<WEBSON_PATH_OR_DOCS>`
- Project conventions/docs: `<PROJECT_DOCS_PATH>`

## Initial expected outcome

After beginner bootstrap, the TicTacToe starter screen should render through Webson. This confirms wiring is correct before board and game-rule implementation.
