# EasyCoder + Webson Minimal Primer

Use this as the complete reference when helping with an EasyCoder/Webson project.

## 0) Non-negotiable rule

If you are unsure about EasyCoder or Webson syntax, ask the user. Do not guess.

## 0a) Strict syntax guardrails

Use these rules exactly:
- Declare variables one per line. Do not use comma declarations.
- Variables must be declared before use.
- Loops use `while ... begin ... end`.
- Do not emit `end while`.
- Do not emit `end if`.
- `begin ... end` blocks must belong to a control statement (for example `while` or `if`), not stand alone.
- Do not invent `function`, `end function`, or recursive call syntax unless the user confirms those forms are supported.
- Do not emit pseudo-keywords from other languages such as `define`, `end define`, `otherwise`, or `endif`.
- Do not emit callable subroutines like `Name(...)`. Use `gosub Label` and shared variables.
- In `.ecs` command lines, expect mostly word-based syntax plus `!`, `:`, and backticks for string literals. Treat other punctuation as suspicious unless explicitly documented.
- Do not emit pseudo-loop forms like `repeat ... end repeat` unless the user confirms they are valid in this runtime.
- Prefer `put ... into Name` over `set Name to ...` unless the user confirms `set` forms are supported.

## 1) EasyCoder quick reference

EasyCoder is a browser-side scripting language (`.ecs`) with English-like syntax.
`index.html` usually loads `https://easycoder.github.io/dist/easycoder.js`, then runs an `.ecs` file.

### 1a) Declarations and elements

```text
div Body
variable Name
string Message
number Counter
boolean Done
```

Variables are single-value by default. To make them array-style:

```text
div Cell
variable Item

set the elements of Cell to 9
set the elements of Item to 20
```

### 1b) Core syntax patterns

```text
put 0 into Counter
add 1 to Counter
take 1 from Counter

if Counter is 3
begin
    put `Three` into Message
end
if Counter is not 3
begin
    put `Other` into Message
end
```

Comparisons: `is`, `is not`, `is greater than`, `is not greater than`, `is less than`, `is not less than`.
Preferred loop bound style: use `is not greater than` instead of `is less than or equal to`.

### 1c) Loops (important)

Use `while ... begin ... end`.
Never use `end while`.
Do not use free-standing `begin ... end` as a loop substitute.

```text
put 0 into N
while N is not greater than 8
begin
    add 1 to N
end
```

### 1d) Labels and flow

Labels are flush-left and end with `:`.
Statements are indented one tab.

```text
Setup:
    go to Main

Main:
    gosub DoSomething
    stop

DoSomething:
    return
```

### 1d.1) Subroutines (preferred pattern)

Use labels + `gosub` + `return` for reusable logic.

```text
script Example

    number Input
    number Output

    put 5 into Input
    gosub Compute
    stop

Compute:
    put Input into Output
    return
```

For iterative work (for example factorial), prefer loop-based subroutines over invented recursive `function` syntax.

Factorial subroutine pattern:

```text
script FactorialDemo

    number Number
    number FactorialResult
    number Counter

    put 56 into Number
    gosub ComputeFactorial
    stop

ComputeFactorial:
    put 1 into FactorialResult
    put 1 into Counter
    while Counter is not greater than Number
    begin
        multiply FactorialResult by Counter
        add 1 to Counter
    end
    return
```

### 1e) Array access and events

Set active element first, then read/write through the array name:

```text
index Cell to 3
put `X` into Cell
put Cell into Value
```

Never use invented syntax like `put element 3 of Cell into Value`.

Attach and events:

```text
attach Body to body
attach Button to `submit-btn`

on click Button
    gosub HandleClick
end on
```

For repeated elements, use one array handler, not one per element:

```text
on click Cell
    put the index of Cell into N
end on
```

### 1f) REST, JSON, render, debug

```text
rest get Data from `data.json`
json count Count in Data
json index Data to 2
json get Item from Data key `name`

rest get ScreenJson from `project.json`
render ScreenJson in Body

debug step
trace
```

### 1f.1) Membership checks (supported)

EasyCoder supports membership tests using `includes` in conditions:

```text
if Vowels includes Ch
begin
    add 1 to VowelCount
end
```

Use this instead of invented forms like `is an element of`.

For strings, this maps to substring/character membership.
For example, after lowercasing input:

```text
put lowercase Sentence into Sentence
put `aeiou` into Vowels
```

### 1f.2) String-processing safety rule

For tasks like "count vowels", do not invent string primitives.
If canonical commands for string length, character access, or membership are not already known, ask the user first.

Ask this minimal clarification:
- "Please confirm the canonical EasyCoder commands for: string length, getting the Nth character, and checking whether a character is in a string (for example `AEIOU`)."

Until confirmed, do not emit pseudo-forms such as `the length of ...`, `the character at position ...`, or `is an element of ...`.

### 1g) Formatting

- Labels flush-left.
- Statements one-tab indent.
- Inside `begin`/`end`, indent one extra tab.
- Comments use `!`.

## 2) Webson quick reference

Webson is JSON UI. In Webson projects: define UI in JSON, `render`, then `attach` IDs in EasyCoder.

### 2a) Structure

```json
{
    "#element": "div",
    "@id": "app",
    "display": "flex",
    "#": ["$Title", "$Content"],
    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Hello"
    },
    "$Content": {
        "#element": "p",
        "@id": "content",
        "#content": "(empty)"
    }
}
```

Rules:
- `#element` required.
- Use `@id`, never plain `id`.
- Child list goes in `#`.
- Child definitions are sibling keys prefixed with `$`.
- Style properties go directly on element objects (no nested `style` object).

## 3) Project layout

A web UI project has three files:

```text
index.html   - loader only (rarely changes)
project.ecs  - behavior and state
project.json - Webson UI layout
```

When starting a new project, use the templates below as your starting point. They provide a responsive layout that works on both mobile phones and desktop browsers.

## 4) Starter template

### `index.html`

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project</title>
    <script src="https://easycoder.github.io/dist/easycoder.js"></script>
</head>
<body>
    <pre id="easycoder-script" style="display:none">
        script Loader
        variable Script
        rest get Script from `project.ecs`
        run Script
    </pre>
</body>
</html>
```

### `project.json`

This Webson layout gives a full-viewport app with a header bar and a scrollable content area. It works on mobile and desktop.

```json
{
    "#element": "div",
    "@id": "app",
    "display": "flex",
    "flex-direction": "column",
    "height": "100vh",
    "margin": "0",
    "font-family": "sans-serif",
    "background": "#f5f5f5",
    "#": ["$Header", "$Content"],
    "$Header": {
        "#element": "div",
        "@id": "header",
        "display": "flex",
        "align-items": "center",
        "padding": "0.5em 1em",
        "background": "#2d2d2d",
        "color": "white",
        "font-size": "1.2em",
        "flex-shrink": "0",
        "#": ["$Title", "$Status"],
        "$Title": {
            "#element": "div",
            "@id": "title",
            "#content": "My App",
            "flex": "1"
        },
        "$Status": {
            "#element": "span",
            "@id": "status",
            "font-size": "0.75em",
            "color": "#aaa"
        }
    },
    "$Content": {
        "#element": "div",
        "@id": "content",
        "flex": "1",
        "overflow-y": "auto",
        "padding": "1em",
        "#": ["$Message"],
        "$Message": {
            "#element": "div",
            "@id": "message",
            "#content": "App is running.",
            "padding": "1em",
            "background": "white",
            "border-radius": "4px"
        }
    }
}
```

### `project.ecs`

```text
    script Project

    div Body
    div Content
    div Header
    span Title
    span Status
    div Message
    variable ScreenJson

    attach Body to body
    rest get ScreenJson from `project.json`
        or stop
    render ScreenJson in Body

    attach Header to `header`
    attach Title to `title`
    attach Status to `status`
    attach Content to `content`
    attach Message to `message`

    set the content of Message to `Ready. Add your UI here.`
    stop
```

### Run

If using ecedit, the server already serves static files:

```bash
easycoder ecedit-server.ecs 8080
```

Open `http://localhost:8080/index.html`.

Otherwise, any static server works:

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500/`.

### Building from the template

To add UI elements, add them to `project.json` (with `@id` attributes) and attach them in `project.ecs`. For example, to add a button below the message:

In `project.json`, add to the `$Content` children:

```json
"$ActionBtn": {
    "#element": "button",
    "@id": "action-btn",
    "#content": "Do Something",
    "margin-top": "1em",
    "padding": "0.5em 1em",
    "cursor": "pointer"
}
```

and update `"#": ["$Message", "$ActionBtn"]`.

In `project.ecs`, declare, attach, and handle:

```text
    button ActionBtn

    attach ActionBtn to `action-btn`

    on click ActionBtn
    begin
        set the content of Message to `Button clicked!`
    end
```

## 5) Working model for responses

1. Restate goal.
2. Ask only for missing constraints.
3. Implement the smallest working step.
4. Explain file changes simply.
5. Give exact run/verify steps.
6. Suggest next step.

First response behavior:
- Do not summarize the primer back to the user.
- Ask only the minimum missing constraints for Milestone 1.
- If constraints are already clear, start implementation immediately.

If uncertain about syntax, ask before generating code.

## 6) Output self-check (before answering)

Before returning EasyCoder code, verify:
1. No comma declarations (for example no `number A, B`).
2. Every variable used is declared.
3. Every `while` has `begin ... end`.
4. No `end while` and no `end if`.
5. No stand-alone `begin ... end` pretending to be a loop.
6. No invented `function` / `end function` blocks.
7. No `define` / `end define`, `otherwise`, or `endif`.
8. No callable subroutine form like `Name(...)`.
9. No `repeat` / `end repeat` unless user-confirmed.
10. Prefer `put ... into ...`; avoid `set ... to ...` unless user-confirmed.
11. For string tasks, if length/character/membership commands are unknown, ask before coding.
12. In `.ecs` command lines, treat punctuation beyond `!`, `:`, and backticks as suspicious unless user-confirmed.
