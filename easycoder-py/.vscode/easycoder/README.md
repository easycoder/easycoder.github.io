# EasyCoder Language Support for VS Code

Provides language support for EasyCoder (`.ecs`) files.

## Features

- **Syntax Highlighting**: Colorizes keywords, operators, strings, numbers, and comments
- **Code Snippets**: Quick templates for common EasyCoder patterns
- **Auto-completion**: IntelliSense support for EasyCoder commands
- **Bracket Matching**: Automatic bracket, parenthesis, and quote pairing
- **Comment Support**: Line comments with `!`

## Installation

To use this extension locally:

1. Copy the `easycoder` folder to your VS Code extensions directory:
   - Linux/Mac: `~/.vscode/extensions/`
   - Windows: `%USERPROFILE%\.vscode\extensions\`

2. Restart VS Code

3. Open any `.ecs` file to see syntax highlighting and autocompletion

## Available Snippets

Type these prefixes and press Tab to insert:

- `script` - Basic script template
- `variable` - Variable declaration
- `set` - Set variable value
- `if` - If-else statement
- `while` - While loop
- `print` - Print statement
- `log` - Log with timestamp
- `onerror` - Error handler
- `add` - Add to variable
- `append` - Append to array
- `get` - GET REST request
- `post` - POST REST request
- `open` - Open file
- `read` - Read from file
- `write` - Write to file
- `use` - Import plugin
- `goto` - Go to label
- `gosub` - Call subroutine
- `input` - Get user input
- `assert` - Assert condition
- `index` - Set array index
- `split` - Split string

## Keywords

The extension recognizes all EasyCoder core keywords including:
- Control flow: `if`, `else`, `while`, `goto`, `gosub`, `return`
- Variables: `variable`, `set`, `clear`
- Arithmetic: `add`, `multiply`, `divide`, `increment`, `decrement`
- Arrays: `append`, `pop`, `push`, `index`, `shuffle`
- I/O: `print`, `log`, `input`, `read`, `write`, `open`, `close`
- REST: `get`, `post`, `send`
- And many more...

## About EasyCoder

EasyCoder is a high-level English-like domain-specific scripting language implemented in Python. 

For more information, visit: https://github.com/easycoder/easycoder-py
