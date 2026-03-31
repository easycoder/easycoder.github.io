# EasyCoder Project — Claude Bootstrap

## First-time setup

> **Beginner tip:** If nothing happens when you start Claude, type **go**.

**IMPORTANT: On EVERY user message** (including "go", "hello", "start", or anything else), first check whether a file called `.easycoder-init` exists in this directory. If it does NOT exist, you MUST immediately run the initialisation process below — do not ask what the user wants, do not wait for further instructions, just start at step 1.

### Initialisation process

1. **Ask the user for the project name.** This will be used as the script name and in filenames.

2. **Ask whether this is a command-line project, a GUI project, or both.**

3. **Create the project files** based on the answer:

   - **Command-line**: Create `<project>.ecs` from the CLI template below.
   - **GUI**: Create `<project>.html`, `<project>-main.ecs`, and `<project>.json` from the GUI templates below.
   - **Both**: Create all four files.

4. **Create `.easycoder-init`** containing the project name and type (cli/gui/both) so this setup is not repeated.

5. **Explain to the user how to run their project:**

   - **CLI**: First install EasyCoder with `pip install -U easycoder`, then run with `easycoder <project>.ecs`. If the `easycoder` command is not found after installing, the user may need to add their Python scripts directory to their PATH (pip will usually show a warning about this).
   - **GUI**: Start a local server with `python3 -m http.server 8080` then open `http://localhost:8080/<project>.html` in a browser. The EasyCoder runtime is loaded from `https://easycoder.github.io/dist/easycoder.js`.

6. **Walk the user through how the files work together.** For GUI projects, explain:

   - The HTML file is just a launcher — it loads the EasyCoder runtime and runs a tiny bootstrap script that fetches the main `.ecs` file.
   - The `.ecs` file is the program logic. It creates a body element, fetches the `.json` layout, and uses `render` to turn the JSON into real page elements. It then `attach`es to those elements by their `@id` to interact with them.
   - The `.json` file defines the page layout using Webson — a JSON format where keys like `#element` create HTML elements, `@id` sets attributes, `#content` sets text, `$Name` defines named components, `#` lists children, and any other key (like `padding` or `color`) is a CSS style.
   - This separation means the layout can be changed without touching the code, and vice versa. It also makes the JSON easy for AI to generate and modify.

   For CLI projects, explain that the `.ecs` file is a standalone script run from the terminal, and walk through what each line does.

7. **Offer the companion editor.** Ask: "Would you like to install the EasyCoder editor? It gives you color-coded syntax highlighting for `.ecs` scripts in your browser." If the user says yes:

   - Copy `ecedit-server.ecs` and `ecedit.html` from `https://raw.githubusercontent.com/easycoder/easycoder.github.io/master/ecedit/` into the project directory. (Use curl, wget, or any available method.)
   - Explain how to use it:
     1. Run `easycoder ecedit-server.ecs 8080` (or any free port) from the project directory. This starts a local file server.
     2. Open `http://localhost:8080/ecedit.html` in a browser.
     3. The editor lets you open, edit, and save `.ecs`, `.json`, `.html` and other project files with syntax highlighting. It fetches its UI from the EasyCoder repo automatically so only the two local files are needed.
     4. The server also serves the project files, so you can test GUI projects at `http://localhost:8080/<project>.html` on the same port.

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

A GUI project uses three files:

- **`<project>.html`** — minimal HTML launcher
- **`<project>-main.ecs`** — EasyCoder script (code)
- **`<project>.json`** — Webson layout (UI definition as JSON)

This separation keeps code and layout independent, and the JSON format is easy for AI to generate and modify.

### `<project>.html`

```html
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><Project></title>
    <script type='text/javascript' src='https://easycoder.github.io/dist/easycoder.js'></script>
</head>
<body>
    <pre id="easycoder-script" style="display:none">
    variable Script
    rest get Script from `<project>-main.ecs`
    run Script
    </pre>
</body>
</html>
```

### `<project>-main.ecs`

```
!   <project>-main.ecs

    script <Project>

    div Body
    variable Layout

    create Body
    rest get Layout from `<project>.json`
    render Layout in Body

    div Display
    attach Display to `display`
    set the content of Display to `Hello from <Project>`

    stop
```

### `<project>.json`

```json
{
    "#doc": "<Project> layout",
    "#element": "div",
    "@id": "page",
    "font-family": "sans-serif",
    "margin": "2em",
    "#": ["$Display"],

    "$Display": {
        "#element": "div",
        "@id": "display",
        "padding": "1em",
        "border": "1px solid #ccc",
        "min-height": "4em"
    }
}
```

**Webson keys:**
- `#element` — HTML element type (`div`, `button`, `img`, etc.)
- `@id`, `@src`, etc. — HTML attributes
- `#content` — inner text/HTML
- `#` — array of child element references
- `$Name` — named component definition
- All other keys are CSS styles

In all templates, replace `<project>` with the project name (lowercase for filenames) and `<Project>` with the capitalised project name.

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
