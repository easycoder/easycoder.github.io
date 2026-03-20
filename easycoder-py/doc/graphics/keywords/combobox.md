# combobox

**Syntax:**
```
combobox VariableName
```

**Description:**
Declares a new combobox widget variable. This variable can be used to create and manipulate a combobox (drop-down list) in the graphics environment.

**Parameters:**
- `VariableName`: The name of the variable to hold the combobox widget.

**Example:**
```
combobox MyCombo
create MyCombo
add 'Option 1' to MyCombo
add 'Option 2' to MyCombo
show MyCombo
```

**Notes:**
- Use `add` to insert items into the combobox.
- Use `select` to choose an item by index or value.
- Use `remove` to delete the current item.

Next: [create](create.md)  
Prev: [close](close.md)

[Back](../../README.md)
