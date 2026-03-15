# EasyCoder + Webson Minimal Primer

Use this as the complete reference when helping with an EasyCoder/Webson project.

## 0) Non-negotiable rule

If you are unsure about EasyCoder or Webson syntax, ask the user. Do not guess.

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
    put `Three` into Message
else
    put `Other` into Message
end if
```

Comparisons: `is`, `is not`, `is greater than`, `is less than`, `is greater than or equal to`, `is less than or equal to`.

### 1c) Loops (important)

Use `while ... begin ... end`.
Never use `end while`.

```text
put 0 into N
while N is less than 9
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

## 3) Minimal project layout

```text
index.html   - loader only
project.ecs  - behavior and state
project.json - Webson UI
```

Minimal loader pattern:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project</title>
    <script src="https://easycoder.github.io/dist/easycoder.js"></script>
</head>
<body id="app-root">
    <pre id="easycoder-script" style="display:none">
        script Loader
        variable Script
        rest get Script from `project.ecs`
        run Script
    </pre>
</body>
</html>
```

## 4) Minimal Hello World

`project.ecs`:

```text
script Project

    div Body
    variable ScreenJson

    attach Body to body
    rest get ScreenJson from `project.json`
        or stop
    render ScreenJson in Body
```

`project.json`:

```json
{
    "#element": "div",
    "@id": "app",
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "center",
    "minHeight": "100vh",
    "fontFamily": "sans-serif",
    "#": ["$Message"],
    "$Message": {
        "#element": "h1",
        "@id": "message",
        "#content": "Hello, World!"
    }
}
```

Run example:

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500/`.

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
