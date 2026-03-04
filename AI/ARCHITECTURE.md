# Architecture Notes (for AI)

## Runtime layers
1. EasyCoder runtime modules (JS)
2. EasyCoder scripts (`.ecs`) for app logic
3. Webson JSON for UI structure
4. Python plugin/server for doclet content and search

## UI path
- `doclets-js.ecs` calls `render MainScreenWebson in Body`
- `Browser.js` handles `render` command
- `Webson.js` builds DOM from `doclets.json`

## Data path
- Client sends MQTT actions (`topics`, `query`, `view`)
- Server returns payloads
- `doclets-js.ecs` updates state and DOM content

## State machine hints
Common states in `doclets-js.ecs`:
- `topics`: waiting/processing available topics
- `query`: processing search results
- `content`: showing selected doclet

## UI behavior rules currently used
- Query input should remain usable
- Send button is enabled only when topics are loaded and selected
- Topic label has three clear states:
  - no selection
  - partial selection
  - all selected

## Known integration sensitivity
If `render ... in Body` fails with "Webson engine is not loaded":
- ensure `Webson.js` is loaded by `index.html`
- ensure Browser render logic and Webson symbol name agree (`EasyCoder_Webson` vs legacy `Webson`)
