# disable

**Syntax:**
```
disable WidgetName
```

**Description:**
Disables a widget, making it unresponsive to user input. The widget will appear grayed out in the UI.

**Parameters:**
- `WidgetName`: The name of the widget variable to disable.

**Example:**
```
pushbutton MyButton
create MyButton text 'Click Me'
disable MyButton
```

**Notes:**
- Use `enable` to re-enable the widget.
- Only widgets can be disabled; attempting to disable non-widget variables will result in an error.

Next: [enable](enable.md)  
Prev: [dialog](dialog.md)

[Back](../../README.md)
