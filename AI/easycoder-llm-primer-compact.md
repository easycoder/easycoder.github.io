# EasyCoder + Webson Ultra-Compact Primer

Use this as authoritative context.
If unsure about syntax, ask the user. Do not guess.

Strict guardrails:
- Declare variables one per line.
- Variables must be declared before use.
- Use `while ... begin ... end`.
- Do not emit `end while`, `end if`, `repeat ... end repeat`.
- Do not emit `define`, `end define`, `otherwise`, `endif`.
- Do not emit `function`, `end function`, or callable subroutines like `Name(...)`.
- Use `gosub Label` + `return` for subroutines.
- In `.ecs` command lines, punctuation beyond `!`, `:`, and backticks is suspicious unless user-confirmed.

## 1) EasyCoder essentials

- `.ecs` is EasyCoder script source.
- `index.html` loads `https://easycoder.github.io/dist/easycoder.js` and runs script text.
- Variables are single-value by default.
- To make arrays: `set the elements of Name to N`.

Declarations:

```text
div Body
variable Name
string Message
number Counter
boolean Done
```

Array setup:

```text
div Cell
variable Item
set the elements of Cell to 9
set the elements of Item to 20
```

Assignment and conditions:

```text
put 0 into Counter
add 1 to Counter
if Counter is 3
begin
    put `Three` into Message
end
if Counter is not 3
begin
    put `Other` into Message
end
```

Loop rule (critical):
- Use `while ... begin ... end`
- Never use `end while`
- Preferred bound style: `is not greater than`

```text
while N is not greater than 8
begin
    add 1 to N
end
```

Array access rule (critical):

```text
index Cell to 3
put `X` into Cell
put Cell into Value
```

Never use invented syntax like `put element 3 of Cell into Value`.

Events:

```text
on click Button
    gosub HandleClick
end on
```

For repeated items, use one array handler:

```text
on click Cell
    put the index of Cell into N
end on
```

Attach, render, debug:

```text
attach Body to body
rest get ScreenJson from `project.json`
render ScreenJson in Body
debug step
trace
```

Membership checks (supported):

```text
if Vowels includes Ch
begin
    add 1 to VowelCount
end
```

Use this instead of `is an element of`.

## 2) Webson essentials

Webson is JSON UI. Prefer Webson-first UI: define JSON -> `render` -> `attach` IDs in EasyCoder.

Rules:
- `#element` is required.
- Use `@id`, never plain `id`.
- Child list goes in `#`.
- Child definitions are sibling keys prefixed with `$`.
- Put style properties directly on element objects.

Example:

```json
{
    "#element": "div",
    "@id": "app",
    "display": "flex",
    "#": ["$Message"],
    "$Message": {
        "#element": "h1",
        "@id": "message",
        "#content": "Hello, World!"
    }
}
```

## 3) Starter template

A web UI project has three files. Use these as your starting point for new projects.

`index.html` (loader — rarely changes):

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

`project.json` (responsive layout — works on mobile and desktop):

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

`project.ecs` (behavior — attach elements, add logic):

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

Add UI elements to `project.json` (with `@id`), then declare, attach, and handle them in `project.ecs`.

## 4) Response policy

For each request:
1. Restate goal.
2. Ask only for missing constraints.
3. Implement smallest working step.
4. Explain changed files simply.
5. Provide exact run/verify steps.
6. Suggest next step.

If syntax confidence is low, ask before code generation.

Before answering, self-check:
1. No undeclared variables.
2. No comma declarations.
3. Every `while` has `begin ... end`.
4. No `end while` or `end if`.
5. No pseudo-keywords (`define`, `otherwise`, `endif`).
6. No pseudo-subroutine forms (`function`, `Name(...)`).
