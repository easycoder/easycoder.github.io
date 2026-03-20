# remove

**Syntax:**
```
remove [the] [current/selected] [item] [from/in] WidgetName
```

**Description:**
Removes the current or selected item from a combobox or listbox widget.

**Parameters:**
- `WidgetName`: The name of the combobox or listbox variable.

**Example:**
```
combobox MyCombo
create MyCombo
add 'Option 1' to MyCombo
add 'Option 2' to MyCombo
remove from MyCombo
```

**Notes:**
- The command is flexible in syntax; optional words like `the`, `current`, `selected`, `item`, `from`, and `in` can be included or omitted.
- Only the current/selected item is removed.

Next: [select](select.md)  
Prev: [pushbutton](pushbutton.md)

[Back](../../README.md)
