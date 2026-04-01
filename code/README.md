# EasyCoder Code

The files here make up the EasyCoder starter pack, distributed as `code.zip`.

## Contents

- `code.ecs` — development server (file serving + editor API)
- `edit.html` — browser-based script editor with syntax highlighting
- `ecedit.ecs` — editor logic (fetched from repo at runtime)
- `ecedit.json` — editor UI layout (fetched from repo at runtime)
- `CLAUDE.md` — AI bootstrap file for Claude Code
- `version` — version tracking for auto-updates

## Installation

1. Download [code.zip](https://easycoder.github.io/code.zip) and unzip it into your project directory.
2. Install EasyCoder: `pip install -U easycoder`
3. Start the server: `easycoder code.ecs 8080` (or any free port).
4. Open your project at `http://localhost:8080/<project>.html`.
5. Open the editor at `http://localhost:8080/edit.html`.

## AI-assisted development

To use with Claude Code:

1. Open a terminal in your project directory and type `claude`.
2. When Claude starts, type **go**.

Claude will read `CLAUDE.md` and guide you through project setup.

See the instructions in our [Primer](https://easycoder.github.io/primer.html).
