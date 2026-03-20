# listbox

**Syntax:**
```
listbox VariableName
```

**Description:**
Declares a new listbox widget variable. Listboxes display a list of items from which the user can select.

**Parameters:**
- `VariableName`: The name of the variable to hold the listbox widget.

**Example:**
```
listbox MyList
create MyList
add 'Item 1' to MyList
add 'Item 2' to MyList
show MyList
```

**Notes:**
- Use `add` to insert items into the listbox.
- Use `remove` to delete the current item.
- Use `on select MyList` to handle selection events.

Next: [messagebox](messagebox.md)  
Prev: [lineinput](lineinput.md)

[Back](../../README.md)
