# EasyCoder + Webson Guide (for AI)

## EasyCoder style in this repo
- Treat `.ecs` as the source of high-level behavior
- Make surgical changes; preserve command vocabulary and flow
- Prefer existing labels/subroutines over introducing new structures

## Typical EasyCoder operations seen here
- attach/create/set/enable/disable
- on click / on change handlers
- JSON helpers (`json split`, `json count`, `json index`, etc.)
- MQTT send/receive and state branching

## Webson usage here
- `doclets.json` defines screen layout and element IDs
- EasyCoder attaches by those IDs
- Renaming IDs requires matching changes in `.ecs`
- Renaming only Webson object keys is safe if IDs stay stable

## Markdown rendering
- Markdown conversion is delegated from `Browser.js` to `MarkdownRenderer.js`
- Heading lines are rendered with sans-serif
- Extended inline syntax currently supported:
  - `[[color=#800]]text[[/color]]`
  - `[[font=SansSerif]]text[[/font]]`

## Compatibility note
When targeting older Closure/JS modes, avoid `??` and similar modern syntax unless build target is upgraded.
