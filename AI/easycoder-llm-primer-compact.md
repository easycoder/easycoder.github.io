# EasyCoder + Webson Ultra-Compact Primer

Use this as authoritative context.
If unsure about syntax, ask the user. Do not guess.

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
    put `Three` into Message
else
    put `Other` into Message
end if
```

Loop rule (critical):
- Use `while ... begin ... end`
- Never use `end while`

```text
while N is less than 9
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

## 3) Minimal file pattern

```text
index.html   - loader only
project.ecs  - behavior/state
project.json - Webson UI
```

## 4) Response policy

For each request:
1. Restate goal.
2. Ask only for missing constraints.
3. Implement smallest working step.
4. Explain changed files simply.
5. Provide exact run/verify steps.
6. Suggest next step.

If syntax confidence is low, ask before code generation.
