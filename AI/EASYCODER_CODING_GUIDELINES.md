# EasyCoder Coding Guidelines

This is a live document and must be read by any agent preparing to work on EasyCoder.

## Core rules

- When multiple objects of the same type serve the same purpose (for example, UI buttons or board cells), use one array-style variable with the required number of elements.
- For related data, keep parallel arrays and process using the same index.
- Attach DOM event handlers (`on click`, etc.) to the array, not to each element individually. The triggered element index should drive logic.
- Never embed HTML directly in EasyCoder script logic. Use Webson for UI structure.

## State and modularity

- In EasyCoder, variables are global within a script. If you need private working state, move that logic into a separate module script (and a Webson file if needed).
- Pass data between scripts either by shared variables at run time or by `send` / `on message`.
- A module can run concurrently with its parent or block and return control. Choose explicitly based on required behavior.
- If the parent must continue, initialize module state and use `release parent`, then continue module processing.

## Plugin strategy

- Create a plugin when EasyCoder syntax is clumsy for a task, or when wrapping substantial external JavaScript functionality.
- Follow established patterns in existing plugins (for example `plugins/gmap.js`).

## Reporting and contribution

- If you find an EasyCoder defect or want to propose syntax changes, report it with clear details.
- Contact: `easycoder.ai@gmail.com`.

## Readability rule

- Begin each large block of functionality with a short purpose comment and a meaningful label (a symbol ending with a colon).
