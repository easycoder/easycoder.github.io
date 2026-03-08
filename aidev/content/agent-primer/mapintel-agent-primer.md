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

## 2A) Required Minimal Templates (Milestone Zero)

Goal of Milestone Zero:

- prove EasyCoder runtime loads,
- prove Webson JSON loads,
- prove `render` executes,
- intentionally show a blank-looking screen where real feature work starts.
- preserve a mobile/desktop decision point so later milestones can diverge layout intentionally.

Agent instruction:

- On first bootstrap, create these three files with equivalent minimal content.
- Do not add extra UI features before this baseline is verified.
- Keep mobile detection in the baseline script, even if both branches initially render a blank screen.

`index.html` (loader only):

Use URL-based runtime loading by default for empty-workspace bootstrap. Relative `js/easycoder/...` paths are valid only when those files are present locally.
Use a clean CDN URL by default (no fixed `?ver=` token). If cache bypass is needed during troubleshooting, use a fresh value (for example a timestamp) intentionally.

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>MapIntel (Bootstrap)</title>
	<script src="https://easycoder.github.io/dist/easycoder.js"></script>
	<!-- If working inside this repo with local runtime files, local imports are also valid. -->
</head>
<body>
	<pre id="easycoder-script" style="display:none">
! MapIntel loader

		script Loader
		variable Script
		rest get Script from `mapintel.ecs?v=` cat now
		run Script
	</pre>
</body>
</html>
```

`mapintel.ecs` (load and render Webson):

```text
! mapintel.ecs

		script MapIntel

		div Body
		variable Mobile
		variable H
		variable N
		variable MainScreenWebson

		clear Mobile
		if mobile
		begin
			if portrait
			begin
				set Mobile
			end
		end

		create Body
		if Mobile
		begin
			set style `width` of Body to `100%`
			set style `height` of Body to `100vh`
			set style `margin` of Body to `0`
		end
		else
		begin
			put the height of the window into H
			multiply H by 9 giving N
			divide N by 16
			set style `width` of Body to N cat `px`
			set style `height` of Body to `100vh`
			set style `margin` of Body to `0 auto`
			set style `border` of Body to `1px solid lightgray`
		end

		rest get MainScreenWebson from `mapintel.json?v=` cat now
				or stop
		render MainScreenWebson in Body
```

`mapintel.json` (valid Webson with intentionally empty output):

```json
{
	"type": "div",
	"style": {
		"width": "100%",
		"height": "100%",
		"background": "#ffffff"
	},
	"items": []
}
```

Expected result:

- Page appears blank (white) but is successfully rendered through Webson.
- This confirms the runtime wiring is correct before adding map/panel behavior.

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

## 3A) Google Maps API Key Prerequisite

If a milestone introduces Google Maps rendering (for example via `gmap` plugin behavior), the agent must raise the API key requirement early.

When to raise it:

- after Milestone Zero is verified,
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
	- Application restrictions: HTTP referrers (web sites)
	- API restrictions: limit to required Maps APIs
6. Add local dev referrers (for example `http://localhost:*` and `http://127.0.0.1:*`) while testing.

Agent behavior for key wiring:

- Default pattern: check browser local storage first (for example `localStorage.getItem('mapintel.googleMapsApiKey')`).
- If missing, prompt the user in-app for the key, validate non-empty input, then store it (for example `localStorage.setItem('mapintel.googleMapsApiKey', key)`).
- Allow user to update/replace the stored key from settings or a developer action.
- Prefer a placeholder pattern in templates only when no runtime key flow is implemented yet, e.g. `YOUR_GOOGLE_MAPS_API_KEY`.
- Explain exactly where the key is read/stored and how to verify map load success/failure.

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

