# MapIntel Agent Primer (Authoritative Bootstrap Context)

Use this document as the setup authority when bootstrapping the MapIntel project.

## Purpose

Create a smartphone-first webapp scaffold using EasyCoder + Webson, then explain what was created in plain language.

## Bootstrap actions

1. Start from an empty workspace.
2. Create initial files:
   - `index.html` (loader/entry page)
   - `mapintel.ecs` (EasyCoder behavior script)
   - `mapintel.json` (Webson layout/styling)
3. Keep `index.html` as a loader (do not embed the full app logic there).
4. Explain each file briefly after creation.

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

After bootstrap, the app may appear empty when served. This is expected before feature wiring is added.
