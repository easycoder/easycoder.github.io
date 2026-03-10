# EasyCoder Coding Guidelines

This is a live document and must be read by any agent preparing to work on EasyCoder.

## Core rules

- When multiple objects of the same type serve the same purpose (for example, UI buttons or board cells), use one array-style variable with the required number of elements.
- For related data, keep parallel arrays and process using the same index.
- Attach DOM event handlers (`on click`, etc.) to the array, not to each element individually. The triggered element index should drive logic.
- Never embed HTML directly in EasyCoder script logic. Use Webson for UI structure.

## Control-flow syntax guard

- EasyCoder block loops use `while ... begin ... end`.
- Do not generate `end while`; that is not the canonical closure form in this codebase.
- For nested loops (for example row/column), each `while` should be followed by `begin` and closed by `end`.

## Webson syntax guard

- In Webson JSON, element IDs must use the `@id` directive.
- Do not use plain `id` as a property when defining element IDs in Webson source.
- Example: use `"@id": "board"` (correct), not `"id": "board"` (incorrect for Webson directives).

## State and modularity

- In EasyCoder, variables are global within a script. If you need private working state, move that logic into a separate module script (and a Webson file if needed).
- Pass data between scripts either by shared variables at run time or by `send` / `on message`.
- A module can run concurrently with its parent or block and return control. Choose explicitly based on required behavior.
- If the parent must continue, initialize module state and use `release parent`, then continue module processing.

## Plugin strategy

- Before adding custom functionality, check whether the behavior already exists in EasyCoder core commands or in an existing plugin.
- Create a plugin when EasyCoder syntax is clumsy for a task, or when wrapping substantial external JavaScript functionality.
- Follow established patterns in existing plugins (for example `plugins/gmap.js`).
- If required functionality is missing from both core and existing plugins, prefer adding a new plugin over forcing complex script-level workarounds.

## External service prerequisites

- When a feature depends on external services (for example Google Maps), state prerequisites early.
- Google Maps functionality requires a Google Maps API key/token; surface this requirement before map implementation work begins.
- Never hard-code production secrets in committed source. Use a runtime-provided value (for example local storage, environment injection, or user prompt flow) and document where it is read.

## Reporting and contribution

- If you find an EasyCoder defect or want to propose syntax changes, report it with clear details.
- Contact: `easycoder.ai@gmail.com`.

## Readability rule

- Begin each large block of functionality with a short purpose comment and a meaningful label (a symbol ending with a colon).
