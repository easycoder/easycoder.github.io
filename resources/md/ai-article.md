# Building Applications with EasyCoder and Claude Code

*A practical approach to AI-assisted development that works for every level of programmer*

---

## Introduction

The rise of AI coding assistants has transformed software development, but it has also created a new problem: the gap between what the AI produces and what you can understand and maintain. "Vibe coding" — asking ChatGPT or Claude to write JavaScript, Python, or React for you — works for generating code, but leaves many developers stranded when it comes time to modify, debug, or understand what they've been given.

This article describes a different approach: using [EasyCoder](https://easycoder.github.io) — a high-level, English-like scripting language — together with [Claude Code](https://claude.ai/claude-code), Anthropic's agentic CLI tool. The combination lets developers of any experience level build real, working applications quickly, with code that reads almost like plain English.

---

## What is EasyCoder?

EasyCoder is a scripting language designed around readability. Instead of:

```javascript
document.getElementById('myButton').addEventListener('click', function() {
    document.getElementById('output').style.backgroundColor = 'pink';
});
```

you write:

```
on click MyButton
begin
    set style `background` of Output to `pink`
end
```

EasyCoder runs in two environments:

- **In the browser** — load a single JavaScript file and write scripts embedded in your HTML page
- **As a command-line tool** — install via `pip install easycoder` and run `.ecs` script files directly

Scripts use the `.ecs` extension and require no build step, no package manager, and no compiler toolchain.

---

## The Problem with Vibe Coding

"Vibe coding" is the practice of prompting an AI to write application code in a mainstream language and accepting the result without fully understanding it. It is seductive — you describe what you want, the AI produces something that looks plausible, and you copy it in. But there are serious drawbacks.

**AI hallucination is amplified in complex languages.** JavaScript, TypeScript, Python — these languages have enormous surface areas. APIs change between versions, library names shift, browser behaviours vary. AI models frequently generate code that uses methods that don't exist, imports that fail, or patterns that were deprecated years ago.

**The output is often not what you asked for.** Complex languages allow many ways to solve a problem. The AI picks one, but it may not be the one you want, and understanding enough to redirect it requires the very expertise you were hoping to avoid.

**Dependency hell.** A React project might require dozens of npm packages. An AI-generated Python app might depend on libraries you don't have. Debugging installation failures is a poor use of anyone's time.

**You can't read it.** If the AI generates 200 lines of JavaScript with callbacks, closures, and async/await, you are trusting code you don't understand. When it breaks — and it will — you are helpless.

**Maintenance becomes expensive.** Today's vibe-coded application is tomorrow's legacy mystery. Nobody — not even the AI — can reliably modify code they didn't fully understand when it was written.

---

## Why EasyCoder + Claude Code Works

EasyCoder changes the equation in three important ways.

**The language is simple enough that the AI rarely makes mistakes.** EasyCoder has a small, consistent vocabulary. Commands read like English sentences. There are no semicolons, no curly braces, no type declarations. Claude Code generates correct EasyCoder on the first attempt almost every time — and when it doesn't, the error is obvious and easy to fix.

**You can read what the AI wrote.** This is the most important difference. Even a non-programmer can look at:

```
on click SaveButton
begin
    put the content of NameField into Name
    rest post Name to `/api/save`
    set the content of Status to `Saved`
end
```

...and understand exactly what it does.

**There is no build system.** Browser applications are a single HTML file and a script. CLI applications are a single `.ecs` file. No `npm install`, no Webpack, no virtual environments to configure.

**Claude Code can modify the code it wrote.** Because EasyCoder scripts are concise and readable, Claude Code can re-read them and make targeted changes. This is fundamentally different from asking an AI to modify 500 lines of opaque JavaScript.

> **Key insight:** The limiting factor in AI-assisted development is not the AI's ability to generate code — it's the human's ability to understand, verify, and maintain what the AI produces. EasyCoder removes that bottleneck.

---

## Getting Started

### Install the Python runtime (for CLI applications)

```bash
pip install easycoder
```

This installs the `easycoder` command. Test it:

```bash
easycoder
```

### For browser applications

No installation needed. Here is a complete working page:

```html
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <script src="https://easycoder.github.io/dist/easycoder-min.js"></script>
</head>
<body>
    <button id="my-button">Click me</button>
    <span id="my-output"></span>

    <pre id="easycoder-script" style="display:none">
        script MyApp

        button ClickMe
        span Output

        attach ClickMe to `my-button`
        attach Output to `my-output`

        on click ClickMe
        begin
            set the content of Output to `Hello, World!`
        end
        stop
    </pre>
</body>
</html>
```

---

## Working with Claude Code

Claude Code is Anthropic's agentic command-line tool. You install it once, then invoke it within any project directory:

```bash
npm install -g @anthropic-ai/claude-code
claude
```

![Claude Code terminal session](/ai-article/1%20claude-session.png)

When you give Claude Code a task, it reads your existing files, writes or modifies code, and explains what it did. For EasyCoder projects, a typical session might look like:

**You:** "Add a button that fetches the current weather from this API and displays the temperature in the Output span."

**Claude Code:** *(reads your .ecs file, adds the button declaration, the REST call, and the display logic, then explains the changes)*

Because EasyCoder scripts are short and readable, Claude Code can read the whole script in seconds and produce targeted changes without creating conflicts or unintended side effects.

---

## Building a Browser UI Application

Let's walk through building a simple note-taking application.

**Step 1: Create the HTML file.**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Notes</title>
    <script src="https://easycoder.github.io/dist/easycoder-min.js"></script>
</head>
<body>
    <h1>My Notes</h1>
    <textarea id="editor" rows="10" cols="50"></textarea><br>
    <button id="save-btn">Save</button>
    <button id="load-btn">Load</button>
    <span id="status"></span>

    <pre id="easycoder-script" style="display:none">
        script Notes

        textarea Editor
        button SaveBtn
        button LoadBtn
        span Status
        variable Content

        attach Editor to `editor`
        attach SaveBtn to `save-btn`
        attach LoadBtn to `load-btn`
        attach Status to `status`

        on click SaveBtn
        begin
            put the content of Editor into Content
            put Content into storage as `my-notes`
            set the content of Status to `Saved`
        end

        on click LoadBtn
        begin
            get Content from storage as `my-notes`
            set the content of Editor to Content
            set the content of Status to `Loaded`
        end
        stop
    </pre>
</body>
</html>
```

![The notes application running in the browser](/ai-article/2%20note-taking-app.png)

**Step 2: Ask Claude Code to extend it.**

> "Add a character count that updates as the user types, shown next to the Save button."

Claude Code adds a few lines to the script:

```
        span CharCount

        attach CharCount to `char-count`

        on change Editor
        begin
            put the content of Editor into Content
            set the content of CharCount to the length of Content cat ` characters`
        end
```

That's the complete extension. No refactoring, no framework changes, no new dependencies.

---

## Building a CLI Application

The Python EasyCoder runtime runs `.ecs` files from the command line. This is ideal for automation scripts, data processing tools, and personal utilities.

Here's a simple file-line counter:

```
    script LineCounter

    variable FileName
    file Lines
    variable Line
    variable Count

    put arg 0 into FileName
    if FileName is empty
    begin
        print `Usage: ec line-counter.ecs <filename>`
        stop
    end

    put 0 into Count
    open FileName as Lines for reading
    while not at end of Lines
    begin
        read Line from Lines
        add 1 to Count
    end
    close Lines

    print FileName cat ` contains ` cat Count cat ` lines`
    exit
```

Run it:

```bash
easycoder line-counter.ecs mydata.csv
```

Ask Claude Code to add filtering, CSV parsing, summary statistics, or output to a file. The script stays readable throughout.

---

## The Scripted Editor

For writing and editing EasyCoder scripts, there is a dedicated web-based editor called **Scripted**. It provides syntax highlighting, a file browser, multiple tabs, and auto-save — all running in your browser against a local file server.

![Scripted editor with a file open and the file browser popup displayed](/ai-article/3%20scripted.png)

The screenshot above shows a script open in the editor — note the syntax highlighting — with the file browser popup in front, listing the available `.ecs` files in the working directory.

### Setup: Four Files

Setting up Scripted requires copying just four files into your working directory:

| File | Purpose |
|------|---------|
| `scripted.html` | The editor web page |
| `scripted.ecs` | The editor application script |
| `scripted.json` | The editor UI layout definition |
| `scripted-server.ecs` | The local file server script |

Copy these files from the [EasyCoder repository](https://github.com/easycoder/easycoder.github.io/tree/master/scripted) into whichever directory holds your `.ecs` files.

### Start the server

```bash
easycoder scripted-server.ecs 8080
```

You should see:

```
EasyCoder version 260322.1
Scripted file server running on port 8080
Serving files from /your/project/directory
Press Ctrl+C to stop
```

### Open the editor

Navigate to:

```
http://localhost:8080/scripted.html
```

Click the folder icon to browse your `.ecs` files and open them for editing. Changes are auto-saved every half second.

### Working with Claude Code alongside Scripted

The recommended workflow is:

1. **Claude Code** handles larger changes — creating new scripts, adding features, restructuring logic
2. **Scripted** handles smaller edits — tweaking values, fixing typos, reading through the code

Because both work on the same files on disk, they complement each other naturally. Claude Code saves a change, Scripted picks it up and reloads automatically.

---

## Setting Up a Client/Server Application

For applications that need to read from or write to the server (rather than just using browser localStorage), you need a server that provides `/read/` and `/write/` routes. The `scripted-server.ecs` already provides exactly this — it acts as both the editor's file server and as a general-purpose backend for your applications.

### Routes provided

| Route | Method | Description |
|-------|--------|-------------|
| `/list` | GET | Returns a JSON array of filenames in the working directory |
| `/read/<filename>` | GET | Returns the contents of a file |
| `/write/<filename>` | POST | Writes the request body to the file |

### Saving data from the browser

```
    variable UserData

    put the content of FormField into UserData
    rest post UserData to `/write/userdata.txt`
    set the content of Status to `Data saved`
```

### Loading data from the server

```
    variable Config

    rest get Config from `/read/config.json`
    json parse Config as Settings
    put property `theme` of Settings into Theme
```

### Handling failures gracefully

```
    rest get Config from `/read/config.json` or
    begin
        set the content of Status to `Could not load configuration`
        stop
    end
```

The `or` clause runs if the request fails — for any reason. No try/catch, no promise chains, no error callback functions.

---

## What EasyCoder Is Best Suited For

EasyCoder is not a general-purpose replacement for Python or JavaScript. It occupies a specific and valuable niche.

**Ideal use cases:**

- **Internal tools and dashboards** — forms, data viewers, admin panels, status pages
- **Personal productivity apps** — note-taking, task lists, habit trackers, timers
- **Prototyping** — turn a concept into a working demo quickly, before committing to a full implementation
- **Educational applications** — where the goal is learning, and complexity in the tooling is a distraction
- **Automation scripts** — file processing, report generation, data transformation
- **Kiosk and display applications** — single-purpose browser apps with predictable, contained state
- **Glue code** — connecting APIs together, transforming data between formats

**Scaling up with scripts and plugins:**

EasyCoder applications are not limited to single scripts. A script can call other scripts, which can call further scripts, covering as large a domain as needed. This "script-calls-script" architecture means there is no practical upper limit on application complexity — only each individual script needs to be simple and readable.

Beyond this, EasyCoder supports **plugins** — extension modules that add specialised vocabulary for domains where the core language would be verbose or awkward. A plugin wraps complex functionality behind simple, English-like commands, much as the word "laser" lets you refer to a complex physical process without describing it every time. For example, an SVG plugin lets you write `svg circle` rather than manually constructing SVG DOM elements.

Plugins can be written by AI agents on an as-needed basis. They don't need central approval or registration — if your application needs a new capability, Claude Code can write a plugin for it and your scripts can load it immediately.

**Less suitable for:**

- Complex UI component trees (React/Vue-style architectures)
- Applications requiring deep OS integration

Note that performance-critical work can be handled by plugins. EasyCoder scripts manage the human-level logic — the flow, the decisions, the user interaction — while plugins encapsulate the messy detail in optimised native code. At the ridiculous extreme, an entire application could be reduced to a single command `doit`, but in practice the split falls naturally: readable scripts for the parts humans need to understand, plugins for the parts that need raw speed or complex low-level integration.

---

## Comparing Approaches

| | Vibe Coding (mainstream) | EasyCoder + Claude Code | Traditional Development |
|---|--------------------------|-------------------------|------------------------|
| **Time to first working app** | Minutes (but fragile) | Minutes (and readable) | Hours to days |
| **AI error rate** | High (complex syntax) | Low (simple syntax) | n/a |
| **Code readability** | Low | High | Varies |
| **Non-programmer can understand** | Rarely | Usually | No |
| **Ongoing maintenance** | Difficult | Easy | Depends on skill |
| **Dependencies** | Many | None | Many |
| **Build step required** | Often | Never | Usually |
| **Suitable for production** | Yes (with care) | Yes (scales via scripts + plugins) | Yes |

---

## Conclusion

The most effective use of AI in software development is not to generate code you can't understand — it's to generate code you *can* understand, so you can verify it, modify it, and maintain it with confidence.

EasyCoder gives the AI a language it can use without making mistakes, and gives you a codebase you can read, understand, and own. Claude Code provides the agentic capability to make meaningful changes to a working project, not just generate one-off snippets.

Together, they represent a practical middle path: not the complexity of full-stack development, and not the opacity of generated black-box code. Just working applications, written in something close to plain English.

**Where to start:**

- [EasyCoder Codex](https://easycoder.github.io/codex.html) — interactive 20-part tutorial
- [EasyCoder Primer](/aidev/agent-primer-js.md) — practical reference for AI agents and developers
- [Claude Code](https://claude.ai/claude-code) — Anthropic's agentic CLI tool
- [Scripted editor](https://github.com/easycoder/easycoder.github.io/tree/master/scripted) — local development setup
- [EasyCoder website](https://easycoder.github.io) — overview and documentation

**Get in touch:**

- [Discord](https://discord.gg/AhaJkJHr) — join the EasyCoder community
- Email: easycoder.ai@gmail.com
