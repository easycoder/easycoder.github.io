# EasyCoder-py AI Assistant Instructions

This guide helps AI coding assistants understand and work effectively with the EasyCoder-py codebase.

## Project Overview

EasyCoder-py is a high-level English-like domain-specific scripting language (DSL) implemented in Python. Key characteristics:

- English-like syntax focused on vocabulary rather than structure
- Command-line based with an emerging graphics module using PySide6
- Acts as a wrapper around standard Python functions
- Extensible through plugin modules
- Suitable for prototyping, rapid testing, and control systems

## Core Architecture

### Main Components:

1. Core Language (`easycoder/`)
   - `ec_compiler.py`: Handles script compilation
   - `ec_program.py`: Manages program execution
   - `ec_core.py`: Core language features
   - `ec_value.py`: Value handling
   - `ec_condition.py`: Condition processing

2. Plugin System (`plugins/`)
   - Seamlessly extends language functionality
   - Example: `points.py` demonstrates coordinate handling
   - Direct integration with Python libraries possible through plugins
   - Plugin must provide both compiler and runtime components

3. Documentation (`doc/`)
   - Core features in `doc/core/`
   - Graphics features in `doc/graphics/`
   - Each keyword/value/condition documented separately

## Development Workflows

### Setup and Installation

1. Basic installation:
```bash
pip install requests easycoder
```

2. Environment setup (Linux):
```bash
export PATH=$HOME/.local/bin:$PATH
```

### Testing

1. Run the comprehensive test suite:
```bash
easycoder scripts/tests.ecs
```

2. Performance benchmarking:
```bash
easycoder scripts/benchmark.ecs
```

3. Individual component testing:
   - `test.py`: Core functionality tests
   - `testrc.py`: Resource tests
   - `testsql.py`: SQL plugin tests
   - `testui.py`: UI/Graphics tests

### Script Development

1. Basic script structure:
```
script ScriptName
    ! Your code here
    exit
```

2. Debugging:
- Use `log` instead of `print` for timestamped debug output
- Example: `log 'Debug message'` outputs with timestamp and line number
- Include `debug` command to enter debug mode when needed

## Project Conventions

1. Script Files
- Extension: `.ecs`
- Always include `exit` command to properly terminate
- Use `script Name` to identify scripts for debugging
- Place scripts in `scripts/` directory

2. Plugin Development
- Place new plugins in `plugins/` directory
- Must provide both compiler and runtime modules
- See `plugins/points.py` for reference implementation
- Use `use plugin-name` to import plugins in scripts

3. Documentation
- Place in `doc/` with appropriate subdirectory
- One markdown file per language feature
- Include syntax, parameters, and examples
- Follow existing documentation patterns in `doc/core/`

## Common Patterns

1. Error Handling
```
on error
    log error
    exit
```

2. Variable Declaration and Management
```
variable Name
set Name to Value
```

3. Plugin Integration
```
use plugin-name
! Plugin-specific commands
```

## Key Integration Points

1. Python Integration
- EasyCoder wraps Python functionality
- Custom plugins can wrap any Python library with suitable API
- Direct Python integration via `system` command

2. Graphics (PySide6)
- Graphics module under active development
- See `doc/graphics/` for current features
- Uses plugin system for seamless integration

## Extending the Language

### Handler Structure

1. Basic Setup
```python
class MyHandler(Handler):
    def __init__(self, compiler):
        Handler.__init__(self, compiler)
    
    def getName(self):
        return 'my_handler'
```

2. Command Implementation Pattern
   - Each command needs two methods:
     - `k_commandname`: Compile-time handler (parsing)
     - `r_commandname`: Runtime handler (execution)
   
   Example:
```python
def k_mycommand(self, command):
    # Parse the command
    command['value'] = self.nextValue()
    if self.nextIs('to'):
        command['target'] = self.nextToken()
        self.add(command)
        return True
    return False

def r_mycommand(self, command):
    # Execute the command
    value = self.textify(command['value'])
    target = self.getVariable(command['target'])
    # Implement command logic
    return self.nextPC()
```

### Key Components

1. Value Handling
   - Use `self.nextValue()` to get the next value token
   - Use `self.textify()` to get actual value during runtime
   - Values can be:
     - Variables: Check with `self.nextIsSymbol()`
     - Literals: Strings, numbers
     - Computed values: From expressions

2. Symbol Management
   - Use `self.getSymbolRecord()` for compile-time symbol info
   - Use `self.getVariable()` for runtime variable access
   - Check `hasValue` property for value-holding variables

3. Error Handling
   - Compile time: Use `self.warning()` for non-fatal errors
   - Runtime: Raise appropriate exceptions:
     - `RuntimeError` for general errors
     - `NoValueError` for missing values
     - `RuntimeAssertionError` for failed assertions

### Plugin Development Best Practices

1. Structure
   - Place plugin file in `plugins/` directory
   - Implement both compiler and runtime components
   - Follow naming convention: `ec_pluginname.py`

2. Integration
   - Register commands in `__init__`
   - Handle both compilation and runtime phases
   - Provide clear error messages
   - Document syntax and usage

3. Testing
   - Create test scripts in `scripts/` directory
   - Test both success and error cases
   - Validate variable state changes
   - Check error handling

### Graphics Extension (PySide6)

1. Widget Handling
   - Extend `Graphics` class for new widgets
   - Implement widget-specific commands
   - Use `isWidget()` for type checking
   - Handle widget lifecycle

2. Layout Management
   - Support different layout types
   - Handle parent-child relationships
   - Manage widget positioning
   - Support dynamic updates

Example widget command:
```python
def k_mywidget(self, command):
    if self.nextIsSymbol():
        record = self.getSymbolRecord()
        command['widget'] = record['name']
        self.add(command)
        return True
    return False
```

## Compiler Reference

### Token Management

1. Position Control
   - `getIndex()`: Get current token position
   - `next()`: Move to next token
   - `rewindTo(index)`: Return to a previous position
   - `peek()`: Look at next token without advancing

2. Token Access
   - `getToken()`: Get current token
   - `nextToken()`: Get next token and advance
   - `tokenIs(value)`: Check current token value
   - `nextIs(value)`: Check next token value
   - `skip(token)`: Skip specified token if next

### Value and Condition Handling

1. Value Processing
   - `getValue()`: Compile current value
   - `nextValue()`: Compile next value
   - `getConstant(token)`: Process constant value
   - `addValueType()`: Register a new value type
   - `hasValue(type)`: Check if type exists

2. Condition Processing
   - `getCondition()`: Compile current condition
   - `nextCondition()`: Compile next condition
   - `compileCondition()`: Process condition syntax

### Symbol Management

1. Symbol Operations
   - `isSymbol()`: Check if current token is a symbol
   - `nextIsSymbol()`: Check if next token is a symbol
   - `getSymbolRecord()`: Get current symbol's data
   - `compileSymbol(command, name, extra)`: Create new symbol
   - `compileVariable(command, extra)`: Create variable symbol

2. Command Compilation
   - `compileToken()`: Compile single token
   - `compileOne()`: Compile one command
   - `compileLabel(command)`: Handle label definitions
   - `compileFromStart()`: Begin compilation
   - `compileFromHere(stopOn)`: Continue from current point

### Error Handling

1. Diagnostic Tools
   - `getLino()`: Get current line number
   - `warning(message)`: Record compilation warning
   - `showWarnings()`: Display all warnings
   - `debugCompile`: Toggle debug output

### Common Usage Patterns

1. Basic Command Parsing
```python
def k_mycommand(self, command):
    # Parse: mycommand {value} to {variable}
    command['value'] = self.nextValue()        # Get first parameter
    if self.nextIs('to'):                      # Check syntax
        if self.nextIsSymbol():                # Verify target is a symbol
            record = self.getSymbolRecord()     # Get symbol info
            command['target'] = record['name']  # Store target name
            self.add(command)                   # Add to compiled code
            return True
    return False
```

2. Complex Syntax With Options
```python
def k_create(self, command):
    # Parse: create (file|directory) {name} [with {options}]
    token = self.nextToken()
    if token in ['file', 'directory']:
        command['type'] = token
        command['name'] = self.nextValue()
        if self.peek() == 'with':
            self.nextToken()
            command['options'] = self.nextValue()
        self.add(command)
        return True
    return False
```

3. Working with Symbols and Values
```python
def k_set(self, command):
    # Parse: set {variable} to {value}
    if self.nextIsSymbol():
        record = self.getSymbolRecord()
        if record['hasValue']:                # Check if can hold value
            command['target'] = record['name']
            self.skip('to')                   # Skip optional keyword
            command['value'] = self.nextValue()
            self.add(command)
            return True
        self.warning('Variable cannot hold a value')
    return False
```

4. Handling Multiple Parameters
```python
def k_add(self, command):
    # Parse: add {value} to {variable} [giving {variable}]
    command['value1'] = self.nextValue()
    if self.nextIs('to'):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.peek() == 'giving':
                # Format: add val1 to val2 giving target
                command['value2'] = self.getValue()
                self.nextToken()
                command['target'] = self.nextToken()
            else:
                # Format: add val1 to target
                command['target'] = record['name']
            self.add(command)
            return True
    return False
```

5. Position Control and Recovery
```python
def k_complex(self, command):
    # Save position in case we need to rewind
    mark = self.getIndex()
    
    # Try to parse one format
    command['value'] = self.nextValue()
    if self.nextIs('to'):
        # First format succeeded
        self.add(command)
        return True
        
    # Rewind and try alternate format
    self.rewindTo(mark)
    if self.nextIs('alternative'):
        # Handle alternative syntax
        return True
        
    return False

```

## Runtime Handler Reference

### Purpose and Structure

Each command's `r_xxx` function implements runtime behavior after compilation. Runtime handlers:
- Retrieve and evaluate parameters from the compiled command dictionary
- Perform the command's core logic (variable operations, I/O, control flow)
- Manage program state and side effects
- Return the next program counter (PC) to continue execution

Basic runtime handler structure:
```python
def r_commandname(self, command):
    # 1. Retrieve parameters from command dict
    value = self.textify(command['value'])
    target = self.getVariable(command['target'])
    
    # 2. Perform the command's action
    result = perform_operation(value)
    
    # 3. Update state if needed
    val = self.getSymbolValue(target)
    val['content'] = result
    self.putSymbolValue(target, val)
    
    # 4. Return next PC
    return self.nextPC()
```

### Core Runtime Functions

1. Value and Variable Access
   - `self.textify(param)`: Evaluate values, variables, expressions at runtime
   - `self.getVariable(name)`: Fetch variable symbol record
   - `self.getSymbolValue(record)`: Get variable's value dict
   - `self.putSymbolValue(record, value)`: Set variable's value dict

2. Control Flow
   - `self.nextPC()`: Return next program counter (normal flow)
   - `self.getPC()`: Get current program counter
   - Return specific PC value for jumps/gotos

3. Condition Evaluation
   - `self.program.condition.testCondition(cond)`: Evaluate condition

4. Error Handling
   - `RuntimeError(self.program, message)`: Runtime error
   - `NoValueRuntimeError(self.program, name)`: Variable has no value
   - `RuntimeAssertionError(self.program, message)`: Assertion failed

### Runtime Patterns

1. Simple Value Assignment
```python
def r_set(self, command):
    # set {variable} to {value}
    value = self.textify(command['value'])
    target = self.getVariable(command['target'])
    val = {}
    val['type'] = 'string'
    val['content'] = value
    self.putSymbolValue(target, val)
    return self.nextPC()
```

2. Arithmetic Operation
```python
def r_add(self, command):
    # add {value} to {variable}
    value1 = self.textify(command['value1'])
    target = self.getVariable(command['target'])
    targetValue = self.getSymbolValue(target)
    
    if targetValue == None:
        targetValue = {'type': int, 'content': 0}
    
    targetValue['content'] = int(targetValue['content']) + int(value1)
    self.putSymbolValue(target, targetValue)
    return self.nextPC()
```

3. Conditional Execution
```python
def r_if(self, command):
    # if {condition} ...
    test = self.program.condition.testCondition(command['condition'])
    if test:
        # Continue to next command
        return self.nextPC()
    else:
        # Jump to 'else' or end
        if 'else' in command:
            return command['else']
        return command['goto']
```

4. Array/List Operations
```python
def r_append(self, command):
    # append {value} to {array}
    value = self.textify(command['value'])
    target = self.getVariable(command['target'])
    val = self.getSymbolValue(target)
    content = val['content']
    
    if content == '':
        content = []
    content.append(value)
    val['content'] = content
    self.putSymbolValue(target, val)
    return self.nextPC()
```

5. File/IO Operations
```python
def r_read(self, command):
    # read {file} to {variable}
    fileRecord = self.getVariable(command['file'])
    target = self.getVariable(command['target'])
    
    content = fileRecord['file'].read()
    val = {}
    val['type'] = 'string'
    val['content'] = content
    self.putSymbolValue(target, val)
    return self.nextPC()
```

6. Error Handling Pattern
```python
def r_assert(self, command):
    # assert {condition} [with {message}]
    test = self.program.condition.testCondition(command['test'])
    if test:
        return self.nextPC()
    # Raise assertion error
    RuntimeAssertionError(self.program, self.textify(command['with']))
```

### Best Practices

1. Value Types
   - Always set `val['type']` when creating value dicts (int, 'string', bool, 'object')
   - Use `val['content']` to store the actual value

2. Variable Validation
   - Check `record['hasValue']` during compilation
   - Handle None values gracefully at runtime
   - Validate array indices and object keys

3. Error Messages
   - Provide clear, actionable error messages
   - Include variable names and values when helpful
   - Use appropriate error types for different failure modes

4. Performance
   - Cache frequently accessed values
   - Avoid redundant symbol lookups
   - Consider lazy evaluation where appropriate

5. Side Effects
   - Document any state changes or I/O operations
   - Ensure proper cleanup (close files, release locks)
   - Handle exceptions from external libraries

Remember: Focus on English-like syntax and readability when writing or modifying code. Keep scripts as readable as natural language where possible.