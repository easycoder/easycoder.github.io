## set

## Syntax:
`set [the] {attribute} of {element} to {value}`

## Examples:
```
set the layout of Window to MainPanel
set text of Button to `Click Me`
set the state of CheckBox to checked
set the background color of Label to 255 255 200
set width of Widget to 800
set the alignment of Button to center
```

## Description:
Set an attribute of a graphic widget or container. The optional article `the` is syntactic sugar for readability—`set the layout of …` and `set layout of …` are equivalent.

### Supported Attributes

- **layout** — assign a layout to a window, panel, or group
- **text** — set text for buttons, labels, line inputs, or multiline editors
- **state** — set checkbox state (checked or unchecked)
- **color** — set label text color
- **background [color]** — set background color for labels, buttons, inputs, etc.
- **style** — apply a CSS stylesheet to a widget
- **alignment** — set widget alignment (left, hcenter, right, top, vcenter, bottom, center)
- **width**, **height** — set fixed widget dimensions (in pixels)
- **spacing** — set layout spacing

### Plugin-Safe Pattern

The full form `set the {attribute} of {widget} to {value}` is graphics-reserved and plugin-safe (article + prepositions act as delimiters). Plugin developers should use qualified attribute names (e.g., `myplugin:attribute`) to avoid collision.

See [PATTERNS.md](../PATTERNS.md) for comprehensive syntax guidelines and plugin-safety notes.

Next: [window](window.md)  
Prev: [select](select.md)

[Back](../../README.md)
