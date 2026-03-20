# dialog

**Syntax:**
```
dialog VariableName
```

**Description:**
Declares a new dialog variable for use in the graphics environment. Dialogs are pop-up windows that can be used for user input, confirmation, or displaying information.

**Parameters:**
- `VariableName`: The name of the variable to hold the dialog widget.

**Example:**
```
dialog MyDialog
create MyDialog type confirm title 'Are you sure?'
show MyDialog
```

**Notes:**
- Dialogs can be created with different types (confirm, lineedit, multiline, generic).
- Use `show` to display the dialog.
- Dialogs can be customized with title, prompt, value, and layout options.

Next: [disable](disable.md)  
Prev: [create](create.md)

[Back](../../README.md)
