# layout

**Syntax:**
```
layout VariableName
```

**Description:**
Declares a new layout variable for use in the graphics environment. Layouts are used to arrange widgets in windows or group boxes.

**Parameters:**
- `VariableName`: The name of the variable to hold the layout.

**Example:**
```
layout MainLayout
create MainLayout type QVBoxLayout
```

**Notes:**
- Layouts can be of type QVBoxLayout, QHBoxLayout, QGridLayout, or QStackedLayout.
- Use `add` to insert widgets or other layouts into a layout.

Next: [lineinput](lineinput.md)  
Prev: [label](label.md)

[Back](../../README.md)
