# EasyCoder Project — Claude Bootstrap

## First-time setup

When you open this project, check whether a file called `.easycoder-init` exists in this directory.

**If `.easycoder-init` does NOT exist**, you MUST run the initialisation process below before doing anything else. Do not skip any step.

### Initialisation process

1. **Ask the user for the project name.** This will be used as the script name and in filenames.

2. **Ask whether this is a command-line project, a GUI project, or both.**

3. **Create the project files** based on the answer:

   - **Command-line**: Create `<project>.ecs` from the CLI template below.
   - **GUI**: Create `index.html` from the GUI template below.
   - **Both**: Create both files.

4. **Create `.easycoder-init`** containing the project name and type (cli/gui/both) so this setup is not repeated.

5. **Explain to the user how to run their project:**

   - **CLI**: Run with `easycoder <project>.ecs` (requires the `easycoder` pip package).
   - **GUI**: Start a local server with `python3 -m http.server 8080` then open `http://localhost:8080` in a browser. The EasyCoder runtime is loaded from `https://easycoder.github.io/dist/easycoder.js`.

---

**If `.easycoder-init` DOES exist**, skip initialisation and proceed normally. Read `.easycoder-init` to learn the project name and type.

---

## CLI template

```
!   <project>.ecs

    script <Project>

    variable Message
    put `Hello from <Project>` into Message
    log Message

    exit
```

## GUI template

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><Project></title>
    <style>
        body { font-family: sans-serif; margin: 2em; }
        #display { padding: 1em; border: 1px solid #ccc; min-height: 4em; }
    </style>
</head>
<body>
    <div id="display"></div>

    <pre id="easycoder-script" style="display:none">

!   <Project>

    script <Project>

    div Display
    attach Display to `display`
    set the content of Display to `Hello from <Project>`

    stop

    </pre>
    <script src="https://easycoder.github.io/dist/easycoder.js"></script>
</body>
</html>
```

In both templates, replace `<project>` with the project name (lowercase for filenames) and `<Project>` with the capitalised project name.

---

## EasyCoder language rules

Use `/ecs-js` for JS/browser dialect context and `/ecs-python` for Python/CLI dialect context before writing or modifying `.ecs` code or runtime source. Use `/ecs-review` to check `.ecs` files for syntax correctness.

### Strict syntax guardrails

- Declare variables one per line — no comma declarations.
- Declare variables before use.
- Loops: `while ... begin ... end` — never `end while`.
- Conditionals: `if ... begin ... end` — never `end if`.
- `begin ... end` blocks must belong to a control statement.
- No `function`, `end function`, `define`, `end define`, `otherwise`, `endif`.
- No callable form `Name(...)` — use `gosub Label` and `return`.
- Assignment: `put ... into Name`.
- If unsure about a command, **ask before writing code**.

### Quick reference

```text
! Comment
script Name

variable V          ! general-purpose variable
number N            ! numeric variable

put 0 into N
add 1 to N
take 1 from N
multiply N by 2
put `hello` into V

if N is 3 begin ... end
while N is less than 10 begin ... end

Label:
    gosub DoWork
    stop

DoWork:
    return
```

### CLI-specific (Python)

```text
get Var from url `https://example.com/api`
put json StringVar into DictVar
put entry `key` of DictVar into Var
exit
```

### GUI-specific (JS/browser)

```text
div Element
button Btn
input Field
img Picture

attach Element to `dom-id`
create Element in Parent
set the content of Element to `text`
on click Btn gosub HandleClick
rest get Var from `/api/data`
```

## Learn as you go

Whenever you spend significant effort researching something — scanning EasyCoder scripts, reading source files, figuring out how a command works, discovering a pattern or convention — **capture what you learned** so it doesn't need to be rediscovered next time. Do this proactively, not only when asked.

Two mechanisms are available:

1. **Update this CLAUDE.md** — if you discover a general fact, convention, or gotcha that applies broadly to this project (e.g. "the `attach` command requires the DOM element to exist before the script runs"), add it to the appropriate section above.

2. **Create a local skill** — if you build up detailed knowledge about a specific area (e.g. how to structure a multi-page app, how MQTT works in EasyCoder, how to do drag-and-drop), write it as a `.md` file in a `skills/` directory and reference it from this file. Use the same frontmatter format as other Claude Code skills.

**When to do this:**
- After answering a question that required reading multiple files or trial-and-error
- After discovering that a command works differently than expected
- After building a non-trivial feature that future sessions might extend
- After finding a pattern that is not documented above but would save time if it were

**Keep it concise** — record what you learned and how to apply it, not the full research trail.

## Language extension policy

If a needed construct does not exist in EasyCoder, **do not invent syntax**. Instead, pause and propose a new command to the user, keeping it consistent with EasyCoder's English-like style.
