# pushbutton

**Syntax:**
```
pushbutton VariableName
```

**Description:**
Declares a new pushbutton widget variable. Pushbuttons are clickable buttons that can trigger actions in the graphics environment.

**Parameters:**
- `VariableName`: The name of the variable to hold the pushbutton widget.

**Example:**
```
pushbutton MyButton
create MyButton text 'Click Me'
on click MyButton
    log 'Button was clicked'
```

**Notes:**
- Use `set text of MyButton to '...'` to change the button's label.
- Use `on click MyButton` to handle button press events.

Next: [remove](remove.md)  
Prev: [on](on.md)

[Back](../../README.md)
