# enable

**Syntax:**
```
enable WidgetName
```

**Description:**
Enables a previously disabled widget, making it responsive to user input again.

**Parameters:**
- `WidgetName`: The name of the widget variable to enable.

**Example:**
```
pushbutton MyButton
create MyButton text 'Click Me'
disable MyButton
enable MyButton
```

**Notes:**
- Use `disable` to disable the widget.
- Only widgets can be enabled; attempting to enable non-widget variables will result in an error.

Next: [group](group.md)  
Prev: [disable](disable.md)

[Back](../../README.md)
