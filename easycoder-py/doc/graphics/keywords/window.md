# window

**Syntax:**
```
window VariableName
```

**Description:**
Declares a new window variable for use in the graphics environment. Windows are top-level containers for other widgets and layouts.

**Parameters:**
- `VariableName`: The name of the variable to hold the window.

**Example:**
```
window MainWin
create MainWin title 'My App' size 800 600
show MainWin
```

**Notes:**
- Use `set layout of MainWin to LayoutName` to add content to the window.
- Windows can be shown or closed using `show` and `close` commands.

Next: [add](add.md)  
Prev: [set](set.md)

[Back](../../README.md)
