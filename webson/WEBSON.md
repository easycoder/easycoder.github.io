# Webson Quick Reference

Webson is a JSON-based UI rendering system used by EasyCoder.
It builds DOM structures from JSON scripts and supports reusable blocks, variable expansion, includes, and state-driven view switching.

## How it is invoked

In EasyCoder script:

- `render SomeWebsonScript in SomeDomParent`

The `render` command parses the JSON and builds the DOM tree under the given parent element.

## Core structure

A Webson script is a JSON object.

- `#element`: DOM tag to create (`div`, `img`, `button`, etc.)
- `#`: children to render (array of names or a `$` reference)
- `#content`: inner content (string or array of fragments)
- `@...`: HTML attributes (`@id`, `@src`, `@type`, ...)
- other keys: CSS style properties (`width`, `display`, `font-size`, ...)
- `$...`: named values or reusable blocks (local symbol table)

## Minimal example

```json
{
  "#element": "div",
  "@id": "panel",
  "width": "100%",
  "#": ["$Title", "$Button"],

  "$Title": {
    "#element": "div",
    "#content": "Hello"
  },

  "$Button": {
    "#element": "button",
    "@id": "ok-button",
    "#content": "OK"
  }
}
```

## Expansion and expressions

Webson expands tokens in strings:

- `$Name` → user-defined symbol
- `#step`, `#random`, `#element_width`, `#parent_width` → built-in symbols
- `<...>` → expression evaluation (non-tag content)

Example:

- `"font-size": "<#parent_width/27>"`
- `"@id": "room-/ROOM/"` (often pre-replaced in EasyCoder before render)

## Directives

### `#repeat`
Repeat rendering of a target block.

Typical fields:

- `#target`: symbol name to render each step
- `#steps` + `#arraysize`: derive iteration count from an array

### `#include`
Include another Webson JSON file by path.

Forms supported:

- object: `{ "Name": "path/to/file.json" }`
- array of include objects
- plain string path

### `#switch`
State-based branch selection.

- compares keys against current `#state`
- optional `default`

### `#onClick`
Declarative state transition hook.

- binds click handler on the current element
- rebuilds from root with updated `#state`

## Async behavior (dev folder version)

In this dev version, render completion is asynchronous and safer:

- `render` resumes EasyCoder only after Webson build completes
- `#include` fetches are awaited
- image elements wait for `load`/`error` (with timeout) before final completion

This reduces race conditions where script continues before UI is fully ready.

## Error/diagnostic notes

- Missing `#element` where required can cause build errors
- Bad `$` references or malformed expression content can expand incorrectly
- `#include` path failures surface as runtime errors
- Set `#debug` to increase console diagnostics (`1`/`2` levels used in renderer)

## Design tips

- Keep reusable components as `$BlockName` objects
- Use `@id` consistently for EasyCoder `attach` targets
- Prefer declarative `#switch`/`#repeat` over manual string assembly
- Keep top-level script focused on layout; load dynamic data in EasyCoder and then render

## Typical workflow in this project

1. EasyCoder fetches Webson JSON (`rest get ...`)
2. EasyCoder runs `render Webson in Parent`
3. EasyCoder attaches DOM variables by known IDs
4. EasyCoder binds click handlers / updates content / style as state changes

## Webson by example (`rbr.json`)

From [resources/webson/rbr.json](resources/webson/rbr.json):

- Root creates `#rbr-screen` as a full-size flex column container.
- Child blocks compose major areas: title bar, outer panel, help/statistics panels, masks, hourglass.
- IDs such as `system-title`, `system-name`, `mainpanel`, `profile-button`, `statusflag` are defined declaratively and then attached in EasyCoder.

### Pattern 1: nested composition

`$Titles` contains `$Statistics`, `$Tools`, `$Title`, `$Subtitle`, `$BannerMask`.
This demonstrates component-style nesting without separate HTML templates.

### Pattern 2: render-time sizing

`"font-size": "<#parent_width/27>"`

This uses expression expansion to scale typography based on container width.

### Pattern 3: image/icon declaration

Icons are plain element declarations:

- `"#element": "img"`
- `"@id": "hamburger-icon"`
- `"@src": "resources/icon/hamburger.png"`

The script can then `attach` to `hamburger-icon` and bind click behavior.

### Pattern 4: overlays/masks as first-class blocks

Elements like `banner-mask` and `title-mask` are declared in layout JSON with:

- absolute positioning
- full-size dimensions
- initial `display: none`

EasyCoder later toggles visibility by style updates, avoiding imperative DOM creation code.

### Pattern 5: reusable row templates

In [resources/webson/room.json](resources/webson/room.json), IDs include placeholders such as `room-/ROOM/-mode-holder`.
EasyCoder substitutes `/ROOM/` before render, allowing one JSON template to generate all room rows consistently.
