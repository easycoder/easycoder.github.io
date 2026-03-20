# add

## Syntax

`add {widget|value} [to] {layout|widget}`  
`add stretch [widget] to {layout}`  
`add spacer size {pixels} to {layout}`  
`add {widget} at {col} {row} in {grid-layout}`

## Parameters

- `widget|value`: The widget or value to add.
- `to`: Optional preposition (default: "to")
- `layout|widget`: The layout or widget to add to.
- `stretch`: Optional keyword to add stretchable space.
- `spacer`: Add a fixed-size spacer.
- `at {col} {row} in`: Position widget in a grid layout.

## Description

Adds a widget or value to a layout, group, list, or combo box. Supports adding stretch spacers and positioning in grid layouts. The `to` preposition is implicit when omitted but can be included for clarity.

## Examples

```
add Label to MainLayout
add Button to Window
add stretch to VerticalLayout
add stretch Spacer to Layout
add spacer size 20 to Layout
add Widget at 2 3 in GridLayout
```

### Plugin-Safe Pattern

The preposition `to` is graphics-reserved (core-only command). Plugins should use qualified container forms (e.g., `add row to Table` for a table plugin) to avoid collision.

See [PATTERNS.md](../PATTERNS.md) for comprehensive syntax guidelines.

## See Also

- [create](create.md)
- [set](set.md)

Next: [attach](attach.md)  
Prev: [window](window.md)

[Back](../../README.md)
