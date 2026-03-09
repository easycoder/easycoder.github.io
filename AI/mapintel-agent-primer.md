# MapIntel Agent Primer (TicTacToe First)

Use this document as the setup authority for the learning path:

1. Beginner stage: TicTacToe.
2. Capstone stage: MapIntel.

## Purpose

Start with a small, complete EasyCoder + Webson app (TicTacToe) so trainees learn runtime wiring, state transitions, and debugging discipline before entering the larger MapIntel scope.

## Bootstrap actions (Beginner)

1. Start from an empty workspace.
2. Create initial files:
   - `index.html` (loader/entry page)
   - `tictactoe.ecs` (EasyCoder behavior script)
   - `tictactoe.json` (Webson layout/styling)
3. Keep `index.html` as a loader (do not embed the full app logic there).
4. Explain each file briefly after creation.
5. Verify local browser run before adding game logic.

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

## Working style

- Work in small, reviewable steps.
- Summarize each change.
- If requirements are unclear, ask a clarifying question.
- Proactively suggest the next milestone.

## Local browser testing

- Raise local testing early.
- Choose an approach based on the current environment.
- If a helper is needed, create one (for example `serve.py`) and explain exactly how to run it.

## Context paths (fill for your environment)

- EasyCoder location: `<EASYCODER_PATH>`
- Webson location/docs: `<WEBSON_PATH_OR_DOCS>`
- Project conventions/docs: `<PROJECT_DOCS_PATH>`

## Initial expected outcome

After beginner bootstrap, the TicTacToe starter screen should render through Webson. This confirms wiring is correct before board and game-rule implementation.
