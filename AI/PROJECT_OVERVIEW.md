# Project Overview (for AI)

## What this repo is
Doclets is a searchable note/doclet system with:
- EasyCoder scripts for app logic and UI flow
- a Python doclet server/plugin for data access
- MQTT for request/response communication
- browser UI rendered from Webson JSON

## Key files
- `doclets-js.ecs`: main JS/browser reader behavior in EasyCoder
- `doclets.json`: Webson UI layout
- `docletServer.ecs`: server-side EasyCoder script
- `ec_doclets.py`: Python plugin with doclet search logic
- `Browser.js`, `Core.js`, `JSON.js`, etc.: EasyCoder JS runtime modules
- `Webson.js`: Webson renderer used by EasyCoder browser render command

## Main design choices
- High-level behavior lives in EasyCoder scripts
- MQTT is the preferred path for low-latency interaction
- Webson is the preferred way to define/build screens

## External references
- EasyCoder repo: https://github.com/easycoder/easycoder.github.io
- Webson repo (older, README still relevant): https://github.com/easycoder/webson
- EasyCoder Codex intro: https://easycoder.github.io

## Current practical workflow
- Keep local JS runtime files as symlinks in this repo
- Build EasyCoder dist in easycoder repo using `build-easycoder`
- For debugging runtime errors, prefer unminified `easycoder.js`
