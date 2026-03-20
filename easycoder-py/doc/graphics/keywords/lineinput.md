# lineinput

**Syntax:**
```
lineinput VariableName
```

**Description:**
Declares a new line input widget variable. Line input widgets allow the user to enter a single line of text.

**Parameters:**
- `VariableName`: The name of the variable to hold the line input widget.

**Example:**
```
lineinput NameField
create NameField text 'Enter your name' size 40
show NameField
```

**Notes:**
- Use `set text of NameField to '...'` to set the input value.
- Use `on click NameField` to handle user input events.

Next: [listbox](listbox.md)  
Prev: [layout](layout.md)

[Back](../../README.md)
