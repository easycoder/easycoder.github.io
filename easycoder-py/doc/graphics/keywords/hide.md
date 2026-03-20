# hide

**Syntax:**
```
hide WidgetName
```

**Description:**
Hides a widget from the user interface. The widget remains in the layout but is not visible.

**Parameters:**
- `WidgetName`: The name of the widget variable to hide.

**Example:**
```
pushbutton MyButton
create MyButton text 'Hide Me'
hide MyButton
```

**Notes:**
- Use `show` to make the widget visible again.
- Only widgets can be hidden; attempting to hide non-widget variables will result in an error.

Next: [label](label.md)  
Prev: [group](group.md)

[Back](../../README.md)
