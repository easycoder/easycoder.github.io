# Graphics Module: Syntax Patterns & Best Practices

This guide documents the canonical syntax patterns used in EasyCoder's graphics module, aligned with Phase 1 syntax standardization. Understanding these patterns helps you write consistent, readable code—and crucially, helps plugin developers avoid colliding with graphics-reserved forms.

---

## Core Pattern: The Article + Preposition Form

Graphics commands extensively use **articles** ("the", "a", "an") and **prepositions** ("of", "to", "in", "from") as syntactic anchors. This pattern is inspired by natural English and serves two purposes:

1. **Readability**: Commands read like English sentences.
   - ✅ `set the layout of Window to MainPanel` (clear intent)
   - ❌ `set layout Window MainPanel` (ambiguous)

2. **Plugin Safety**: Articles and prepositions act as **delimiters** that reduce collision risk.
   - Core uses `the layout of … to …` consistently.
   - If a plugin needs a `layout` command, it can use a bare form like `layout configure …` without collision.

---

## Syntax Pattern 1: Attribute Setting — `set [the] {attribute} of {widget} to {value}`

### Canonical Form
```
set the layout of Window to MainPanel
set the text of Button to `Click here`
set the state of CheckBox to checked
set the background color of Label to 255 255 200
```

### Optional Article
The article `the` is **optional and syntactic sugar**:
```
set layout of Window to MainPanel        ! Same as 'set the layout of …'
set text of Button to `Click here`       ! Same as 'set the text of …'
```

### Supported Attributes (Graphics-Reserved)
- **layout** — assign a layout to a window/panel/group
- **text** — set button/label text
- **state** — set checkbox state (checked/unchecked)
- **color** — set label color
- **background [color]** — set background color
- **style** — apply CSS stylesheet
- **alignment** — set widget alignment (left, hcenter, right, top, vcenter, bottom)
- **width**, **height** — set fixed dimensions
- **spacing** — layout spacing

### Plugin Implications
- **Reserved stem**: `layout` (in the form `the layout of`), `text`, `state`, `color`, etc., are claimed by graphics.
- **Safe alternative for plugins**: Use qualified forms like `database text of Record` or `filesystem layout of Path`.
- **Do not claim**: Bare verbs like `text`, `layout` as plugin commands (collision risk with graphics attributes).

---

## Syntax Pattern 2: Adding to Containers — `add {widget} [preposition] {target}`

### Canonical Forms
```
add Button to MainLayout
add Widget to Window
add stretch Spacer to MainLayout
add spacer size 10 to MainLayout
add Widget at 0 1 in GridLayout
```

### Optional Prepositions
- **to** — add widget to layout/window (most common)
- **at {col} {row} in {grid}** — add to specific grid position
- **size** — for spacer elements (semantic preposition)

### Plugin Implications
- **Reserved stems**: `add` is core-only; graphics uses `add Widget to Layout` consistently.
- **Safe alternative for plugins**: Extend via `add X using {plugin-name}` or new context (e.g., `add row to Table` for a table plugin).

---

## Syntax Pattern 3: Widget Declaration — `{widget-type} {name}`

### Canonical Forms
```
window MainWindow
layout MainLayout
pushbutton ClickButton
label StatusLabel
checkbox EnableFeature
lineinput NameInput
multiline Description
listbox SelectionList
combobox ChoiceBox
```

### Plugin Implications
- **Reserved stems**: Widget types are core-graphics reserved: `window`, `layout`, `pushbutton`, `label`, `checkbox`, `lineinput`, `multiline`, `listbox`, `combobox`, `dialog`, `messagebox`, `group`, `panel`.
- **Safe alternative for plugins**: Create new widget types with qualified names: `custom_widget MyWidget` or `table DataTable`.

---

## Syntax Pattern 4: Widget Creation — `create {widget} [attributes …]`

### Canonical Forms
```
create Window title `My App` size 800 600 fill color 255 255 255
create Button text `Submit` background color 0 120 240
create Layout type QVBoxLayout
```

### Attribute Forms
Attributes use **bare name = value** syntax (no article):
```
title `Window Title`
size 800 600
fill color R G B
type QVBoxLayout
text `Button Label`
```

### Plugin Implications
- **Reserved stems**: Attribute names (title, size, fill, type, text, etc.) are graphics-reserved.
- **Safe alternative for plugins**: Use namespaced attributes: `database_id` or `custom:attribute-name`.

---

## Value Expression Pattern: `the {attribute} of {widget}`

### Canonical Forms (For Future Use)
```
log the title of MainWindow
log the text of Button
set Size to the width of Widget
```

### Current Support
This pattern is **recognized and reserved** for future graphics enhancements. Currently, most attributes are set but not read as value expressions. Future phases will extend this capability.

### Plugin Implications
- **Reserved form**: `the {attribute} of {widget}` is graphics-reserved.
- **Safe alternative**: `get {attribute} from {widget}` or `widget {widget} property {attribute}`.

---

## Event Handling Pattern: `on {widget} {signal} [do] {action}`

### Canonical Forms (Current)
```
on Button clicked log `Button was clicked`
on Window closed exit
on CheckBox toggled fork ProcessToggle
```

### Plugin Implications
- **Reserved stems**: Signal names (`clicked`, `toggled`, `closed`, etc.) are graphics-reserved.
- **Safe alternative for plugins**: Use namespaced signals: `on Table row_selected` or qualified events: `on Database record_saved`.

---

## Removing Widgets — `remove [the] [current/selected] [item] [from/in] {container}`

### Canonical Forms
```
remove the current item from ListBox
remove selected item in ComboBox
remove item from ListBox                ! 'the' and 'current' optional
```

### Optional Elements
- **the** — optional article
- **current/selected** — optional modifier (defaults to current)
- **item** — optional keyword
- **from/in** — interchangeable prepositions

### Plugin Implications
- **Reserved stem**: `remove` (in graphics context) is core-only for widgets.
- **Safe alternative for plugins**: Extend with context: `remove record from Database` or `remove file from Filesystem`.

---

## Reserved Graphics Stems & Attributes

### Widget Types (Core-Reserved)
- window, layout, pushbutton, label, checkbox, lineinput, multiline, listbox, combobox, dialog, messagebox, group, panel

### Commands (Core-Reserved)
- create, add, remove, set, show, hide, close, enable, disable, clear, select, attach, center, on

### Attribute Names (Core-Reserved in "the X of …" form)
- layout, text, state, color, background, style, alignment, width, height, spacing

### Signal/Event Names (Core-Reserved)
- clicked, toggled, closed, opened, selected, activated, changed, entered, exited

---

## Comparison: Graphics vs. Core vs. Plugins

| Pattern | Core Example | Graphics Example | Plugin (Safe) |
|---------|--------------|------------------|---------------|
| **Verb + Preposition** | `put X into Y` | `set the layout of Window to Panel` | `sql query from Database to Result` |
| **Article + Preposition** | `add X to Y giving Z` | `add Button to Layout` | `file copy of Source to Dest` |
| **Optional Article** | `add X to Y` | `set layout of Window to Panel` | `database field of Table` |
| **Reserved Stems** | `put`, `set`, `cat` | `layout`, `text`, `clicked` | Namespace: `mydb_layout`, `myfs_text` |

---

## Guidelines for Plugin Developers

### Do's ✅
- Use **full forms with articles/prepositions**: `the X of Y to Z` (safer than bare forms).
- **Namespace attributes**: `myplugin:attribute-name` or `myplugin_attribute`.
- **Check reserved stems** (see [RESERVED_STEMS.md](../RESERVED_STEMS.md)) before claiming a keyword.
- **Document your syntax** following this pattern guide.

### Don'ts ❌
- Don't use bare graphics stems as plugin verbs: `text Widget Hello` (conflicts with graphics `set the text of …`).
- Don't claim widget types without qualification: `button MyButton` (conflicts with graphics `pushbutton`).
- Don't use graphics attribute names as top-level keywords: `layout configure …` (too close to graphics `the layout of …`).

### Example: Safe Plugin Command
```
! Good: namespaced, clear preposition, no conflicts
mqtt publish to broker/topic with payload

! Risky: bare verb that might conflict with graphics or core
text send data        ! 'text' is graphics-reserved; 'send' might conflict with core event handlers

! Better
mqtt send to broker/topic using payload
```

---

## Testing & Validation

When adding new graphics commands or attributes:

1. **Use the pattern**: Follow `the … of …` for attributes, `add X to Y` for containers.
2. **Document variants**: If you add optional forms, document them (e.g., optional article, optional preposition).
3. **Check reserved stems**: Ensure new stems don't conflict with core or existing plugins.
4. **Write examples**: Provide both canonical and shorthand forms (if applicable).
5. **Test**: Run the graphics test suite (`testg.ecs`) to validate no regressions.

---

## See Also

- [SYNTAX_REFACTORING.md](../SYNTAX_REFACTORING.md) — Core syntax standardization plan.
- [RESERVED_STEMS.md](../RESERVED_STEMS.md) — Comprehensive list of core and graphics reserved keywords.
- [PLUGIN_PATTERNS.md](../PLUGIN_PATTERNS.md) (forthcoming) — Extension-safe patterns for plugin developers.
- [doc/core/](../core/) — Core module keyword reference.
- [doc/graphics/keywords/](./keywords/) — Graphics module keyword reference.

