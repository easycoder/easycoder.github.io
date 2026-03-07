# MapIntel Agent Primer (Authoritative Context)

Use this file as the machine-facing source of truth when helping users build or extend the MapIntel project.

## 1) What the Agent Must Understand

MapIntel is a smartphone-first webapp built with:

- EasyCoder for app behavior and flow (`.ecs` scripts)
- Webson for UI structure and styling (`.json` layouts)
- Plain `index.html` as a loader/entry page

The goal is not only to generate code, but to help users learn practical software development through small, testable milestones.

## 2) Core Outcome Expected from Bootstrap

When a user starts from an empty workspace, bootstrap these files first:

1. `index.html`
2. `mapintel.ecs`
3. `mapintel.json`

Explain each file in plain language:

- `index.html`: lightweight loader and runtime entry point
- `mapintel.ecs`: EasyCoder behavior/state flow
- `mapintel.json`: Webson UI layout and style model

Keep `index.html` minimal. Do not embed all app logic in HTML unless explicitly requested.

## 3) Repo Orientation (Current Workspace)

Authoritative external references (do not infer these from the primer page URL):

- EasyCoder repository: `https://github.com/easycoder/easycoder.github.io`
- Webson repository (legacy but relevant docs): `https://github.com/easycoder/webson`
- EasyCoder docs entry point: `https://easycoder.github.io`

Relevant references in this repository:

- `AI/WEBAPP_AI_MANUAL.md`: full process and MapIntel case study
- `AI/mapintel-agent-primer.md`: alternate agent-facing starter version
- `mapintel-primer.html`: human-facing primer page
- `webson/WEBSON.md`: Webson quick reference and render model
- `aidev/project.ecs`: working EasyCoder flow for the primer app
- `project.json`: Webson content/layout used by the primer app

Runtime components are in `js/easycoder/` (for example `Core.js`, `Browser.js`, `Webson.js`, `EasyCoder.js`).

Rule: treat this primer as the authority for repository/doc URLs. Do not derive repo paths from the primer markdown URL itself.

## 4) Working Model the Agent Should Apply

Follow this sequence:

1. Restate intent and constraints briefly.
2. Propose a short plan (small reviewable steps).
3. Create/update files needed for the current milestone only.
4. Explain what changed and why.
5. Raise local browser testing early, pick the best option for this environment, and implement it if needed.
6. Suggest the next milestone.

Prefer explicit state transitions and readable naming over hidden side effects.

## 5) Local Testing Expectations

Always address testing near the start of implementation.

Environment-dependent options:

- If a local static server already exists, use it.
- Otherwise, set one up and provide exact run instructions.

In this repo, a common option is:

- `python3 -m http.server 5500`

Then open `http://localhost:5500/` in a browser.

## 6) Architecture Rules of Thumb

- UI structure belongs in Webson JSON.
- Behavior, events, and state machine logic belong in EasyCoder scripts.
- Keep DOM IDs stable once behavior is attached.
- Make loading/error/empty states explicit.
- For early bootstrap, an empty-looking screen can be normal before UI and behavior are wired.

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

- "Set up the initial template"
- "Why is my screen blank?"
- "Add map click -> details panel flow"
- "How should I structure states?"
- "How do I run this locally?"

Expected response behavior:

- Identify current milestone.
- Implement only what that milestone requires.
- Show where each change lives.
- Provide a quick test the user can run immediately.

## 9) Readiness Checklist

Before claiming completion, confirm:

1. Required files exist and match their roles.
2. Loader path and runtime includes are valid.
3. Webson render path is wired from EasyCoder.
4. Testing path is explained and runnable.
5. User received a plain-language summary and next step.

If all items pass, the agent is ready to handle normal MapIntel prompts reliably.

