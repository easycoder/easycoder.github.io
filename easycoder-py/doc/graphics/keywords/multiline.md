# multiline

**Syntax:**
```
multiline VariableName
```

**Description:**
Declares a new multiline input widget variable. Multiline widgets allow the user to enter multiple lines of text.

**Parameters:**
- `VariableName`: The name of the variable to hold the multiline widget.

**Example:**
```
multiline Notes
create Notes cols 40 rows 5
show Notes
```

**Notes:**
- Use `set text of Notes to '...'` to set the input value.
- Use `on click Notes` to handle user input events.

Next: [on](on.md)  
Prev: [move](move.md)

[Back](../../README.md)
