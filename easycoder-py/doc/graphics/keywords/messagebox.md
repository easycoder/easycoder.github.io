# messagebox

**Syntax:**
```
messagebox VariableName
```

**Description:**
Declares a new message box variable for use in the graphics environment. Message boxes are used to display messages or prompt the user for a response.

**Parameters:**
- `VariableName`: The name of the variable to hold the message box.

**Example:**
```
messagebox MsgBox
create MsgBox style question title 'Confirm' message 'Are you sure?'
show MsgBox giving Result
```

**Notes:**
- Message boxes can have different styles (question, yesnocancel, warning, etc.).
- Use `show` to display the message box and capture the result.

Next: [multiline](multiline.md)  
Prev: [listbox](listbox.md)

[Back](../../README.md)
