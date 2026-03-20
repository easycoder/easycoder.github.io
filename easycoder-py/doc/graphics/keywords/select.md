# select

**Syntax:**
```
select index Value of WidgetName
select Value in WidgetName
```

**Description:**
Selects an item in a combobox by index or by value (text).

**Parameters:**
- `Value`: The index (number) or value (string) to select.
- `WidgetName`: The name of the combobox variable.

**Example:**
```
combobox MyCombo
create MyCombo
add 'Option 1' to MyCombo
add 'Option 2' to MyCombo
select index 1 of MyCombo
select 'Option 2' in MyCombo
```

**Notes:**
- Indexing is zero-based.
- If the value is not found, no selection is made.

Next: [set](set.md)  
Prev: [remove](remove.md)

[Back](../../README.md)
