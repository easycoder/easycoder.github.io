# VS Code EasyCoder Extension Installation

The EasyCoder language extension has been created and installed for VS Code.

## What's Included

1. **Syntax Highlighting** - Keywords, strings, numbers, and comments are color-coded
2. **Code Snippets** - Quick templates for common patterns (type prefix + Tab)
3. **Auto-completion** - IntelliSense suggestions as you type
4. **Auto-closing** - Brackets, quotes, and parentheses close automatically
5. **Comment Toggling** - Use Ctrl+/ to toggle line comments

## Installation

The extension is located at: `.vscode/easycoder/`

**To activate:**
1. Reload VS Code: Press `Ctrl+Shift+P` and type "Reload Window"
2. Open any `.ecs` file to see the features in action

## Usage Examples

### Using Snippets

Type these prefixes and press **Tab**:

- `script` + Tab → Creates full script template
- `if` + Tab → Creates if-else block
- `while` + Tab → Creates while loop
- `variable` + Tab → Declares a variable
- `set` + Tab → Sets variable value
- `print` + Tab → Print statement
- `log` + Tab → Log with timestamp

### Auto-completion

As you type EasyCoder keywords, VS Code will show suggestions:
- Type `var` → suggests `variable`
- Type `app` → suggests `append`
- Type `mul` → suggests `multiply`

### Comment Toggling

- Select lines and press `Ctrl+/` to toggle comments
- Comments in EasyCoder start with `!`

## Testing

Open one of your existing scripts to test:
```bash
code scripts/hello.ecs
```

You should see:
- Syntax highlighting for keywords
- Colored strings and numbers
- IntelliSense suggestions as you type
- Snippet suggestions when typing common prefixes

## Troubleshooting

If the extension doesn't activate:
1. Reload Window: `Ctrl+Shift+P` → "Reload Window"
2. Check file extension is `.ecs`
3. Verify extension is in `.vscode/easycoder/` (project) or `~/.vscode/extensions/easycoder/` (user)
4. Restart VS Code completely

## Customization

To modify the extension, edit files in:
`.vscode/easycoder/`

- `syntaxes/easycoder.tmLanguage.json` - Syntax highlighting rules
- `snippets/easycoder.json` - Code snippets
- `language-configuration.json` - Language behavior settings

After changes, reload VS Code to see updates.
