# Plugin Development Patterns: Safe Extension Guidelines

This guide provides plugin developers with **proven patterns** for extending EasyCoder safely, avoiding collision with core and graphics reserved stems while maintaining readability and consistency with EasyCoder's English-like syntax philosophy.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Safe Command Patterns](#safe-command-patterns)
3. [Safe Value Expression Patterns](#safe-value-expression-patterns)
4. [Safe Condition Patterns](#safe-condition-patterns)
5. [Event Handler Extension](#event-handler-extension)
6. [Graphics Widget Extension](#graphics-widget-extension)
7. [Worked Examples](#worked-examples)
8. [Validation Checklist](#validation-checklist)
9. [Collision Detection](#collision-detection)

---

## Core Principles

### 1. Always Consult Reserved Stems

Before claiming any keyword stem, check:
- **`RESERVED_STEMS.md`** — Verbs and command keywords
- **`doc/core/values/operations.md`** — Value operation stems
- **`doc/graphics/PATTERNS.md`** — Graphics-specific stems

### 2. Use Syntactic Anchors

EasyCoder uses articles ("the"), prepositions ("to", "of", "in", "from"), and conjunctions ("and") as **disambiguation delimiters**. Leverage these:

```
! Core pattern (safe for plugins to imitate):
the cat of A and B

! Plugin pattern (safe, different context):
the result of query on Database and filters
```

### 3. Prefer Qualified Forms

**Always namespace your keywords** to avoid ambiguity:

```
! Safe: plugin-namespaced
json encode Value
database query from Table
mqtt publish to Topic with Payload

! Risky: bare verbs (too close to reserved stems)
encode Value          ! Conflicts with core 'encode'
query from Table      ! Could conflict with future core
```

### 4. Prefer Full Forms Over Bare Words

Use articles and prepositions even if optional:

```
! Safer:
set the temperature of Sensor to Value

! Less safe:
set temperature Sensor Value
```

### 5. Plugin Keywords Are Lowercase

Follow EasyCoder convention (variables are CapitalCase, keywords are lowercase):

```
! Correct:
json encode MyData
database select from Users

! Incorrect:
JSON Encode MyData
Database Select From Users
```

---

## Safe Command Patterns

### Pattern 1: `{plugin-name} {verb} {params}`

**Format**: Plugin name as namespace, followed by domain-specific verb.

```
! JSON plugin
json decode EncodedData into Result
json encode Data with pretty
json validate against Schema

! Database plugin
database connect to ServerAddress with Credentials
database query from TableName giving Results
database insert into Table values Data

! MQTT plugin
mqtt connect to BrokerAddress
mqtt publish to Topic with Message
mqtt subscribe to Topic from Broker
```

**Advantages**:
- Clear namespace prevents collision
- Reads naturally (e.g., "json decode...")
- Easy to search/grep for plugin commands
- Plugin clearly identified in error messages

**Handler Implementation**:
```python
class JSONPlugin(Handler):
    def getName(self):
        return 'json'
    
    def k_encode(self, command):
        # Parse: json encode {value} [with {option}]
        command['value'] = self.nextValue()
        if self.nextIs('with'):
            command['option'] = self.nextValue()
        self.add(command)
        return True
    
    def r_encode(self, command):
        import json
        value = self.textify(command['value'])
        result = json.dumps(json.loads(value), indent=2)
        # Store result in target variable
        return self.nextPC()
```

---

### Pattern 2: `{verb} {object} via {plugin-name}`

**Format**: Natural verb, clarified with "via {plugin}".

```
! File plugin
copy SourceFile to DestFile via filesystem
compress Archive from Directory via zip
encrypt Data with Key via openssl

! Network plugin
send Request to URL via http
fetch Resource from Server via ftp
```

**Advantages**:
- Very English-like
- Verb isn't namespaced (plugin provides implementation)
- "via" clearly indicates plugin involvement

**Handler Implementation**:
```python
# In core 'copy' handler, delegate to plugin:
def k_copy(self, command):
    command['source'] = self.nextValue()
    self.skip('to')
    command['target'] = self.nextValue()
    if self.peek() == 'via':
        self.nextToken()
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['plugin'] = record['name']
            self.add(command)
            return True
    # Handle core 'copy' if no plugin specified
    self.add(command)
    return True
```

---

### Pattern 3: `{verb} [the] {attribute} [of {object}] [with {params}]`

**Format**: Attribute-centric operations with optional prepositions.

```
! Cache plugin
clear the cache with scope Database
flush the buffer with timeout 30

! Config plugin
set the configuration from File with validation
load the settings from ConfigPath with defaults
```

**Advantages**:
- Consistent with core `set` pattern
- Optional articles/prepositions for readability
- Attribute names can be reserved for plugin

**Handler Implementation**:
```python
def k_clear(self, command):
    self.skipArticles()
    token = self.nextToken()
    command['what'] = token
    if token == 'cache':
        if self.nextIs('with'):
            command['scope'] = self.nextValue()
        self.add(command)
        return True
    return False
```

---

## Safe Value Expression Patterns

### Pattern 1: `the {operation} of {input} [via {plugin}]`

**Format**: Attribute-like access with optional plugin qualification.

```
! JSON plugin
put the decoded form of JSONString into Data
set Result to the parsed form of ConfigFile via json

! Math plugin
put the square root of Value into Result
set Angle to the sine of Radians via trigonometry
```

**Advantages**:
- Reads naturally
- "the" + "of" delimiters prevent collision
- "via" clarifies plugin involvement if needed

**Implementation in Handler**:
```python
def v_decoded(self, value):
    # Return decoded JSON value
    import json
    try:
        decoded = json.loads(self.textify(value))
        return decoded
    except:
        raise RuntimeError(self.program, f"Invalid JSON: {value}")
```

---

### Pattern 2: `{input} {plugin-verb} {params}`

**Format**: Infix notation for plugin-specific operations (use sparingly).

```
! Crypto plugin
put Data encrypt-with Key into Encrypted
set Decrypted to Encrypted decrypt-with Key

! String plugin
put Text uppercase-by Locale into Result
```

**Advantages**:
- Very English-like for certain domains
- Hyphenated verbs signal plugin involvement

**Disadvantages**:
- Harder to parse than prefix forms
- Use only if natural readability justifies complexity

---

## Safe Condition Patterns

### Pattern 1: `is {plugin-condition}`

**Format**: Type/state checking via plugin conditions.

```
! Type checking
if Data is valid-json log `Valid JSON`
if File is readable log `Can read file`
if Network is connected log `Online`

! State checking
if Cache is empty log `Populate cache`
if Queue is full log `Wait before adding`
```

**Implementation**:
```python
def c_valid_json(self, test):
    # Compile: is valid-json
    self.nextToken()  # consume 'valid-json' or hyphenated form
    test['type'] = 'valid-json'
    return test

def r_c_valid_json(self, test, value):
    # Runtime: test if value is valid JSON
    import json
    try:
        json.loads(self.textify(value))
        return True
    except:
        return False
```

---

### Pattern 2: `{condition} [and|or] {condition}`

**Format**: Compound conditions combining plugin and core conditions.

```
if Data is valid-json and Length is greater than 0
    log `Valid non-empty JSON`
```

**Implementation**: Core compiler already supports `and`/`or`; plugin conditions integrate seamlessly.

---

## Event Handler Extension

### Pattern: `on {widget|event} {signal} [do] {action}`

**Format**: Extend graphics event handling via plugins.

```
! Hypothetical table plugin
on Table row-selected do SelectRowHandler
on Table sort-by-column do SortHandler

! Hypothetical network plugin
on Socket data-received do ProcessData
on Connection error do HandleError
```

**Implementation**:
```python
def k_on(self, command):
    if self.nextIsSymbol():
        record = self.getSymbolRecord()
        command['widget'] = record['name']
        
        # Get signal name
        signal = self.nextToken()
        command['signal'] = signal
        
        # Optional 'do'
        self.skip('do')
        
        # Get target handler
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['handler'] = record['name']
            self.add(command)
            return True
    return False
```

---

## Graphics Widget Extension

### Pattern: New widget types and attributes

**For new widget types**:
```
table DataTable
datagrid Records
tree FileTree
```

**For new attributes**:
```
set the column-width of Table to 100
set the sort-enabled of DataGrid to true
set the expand-on-click of Tree to checked
```

**Implementation**:
```python
class TablePlugin(Handler):
    def k_table(self, command):
        # Declare a table widget
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            return self.compileVariable(command, 'ECTable')
        return False

    def k_set(self, command):
        # Extend graphics set for table attributes
        self.skipArticles()
        token = self.nextToken()
        
        if token == 'column-width':
            # Parse: set the column-width of Table to {value}
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['widget'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        
        # Delegate to graphics handler for other attributes
        return False
```

---

## Worked Examples

### Example 1: Simple JSON Plugin

**Goal**: Provide `json encode` and `json decode` commands.

**Reserved check**:
- ✅ `json` not in RESERVED_STEMS.md
- ✅ `encode`/`decode` are core operations, but `json encode` is qualified → safe

**Implementation**:

```python
# plugins/json.py
from easycoder.ec_handler import Handler
import json

class JSON(Handler):
    def getName(self):
        return 'json'
    
    # Compile: json encode {value}
    def k_encode(self, command):
        command['value'] = self.nextValue()
        self.add(command)
        return True
    
    # Runtime: json encode {value}
    def r_encode(self, command):
        try:
            value = self.textify(command['value'])
            data = json.loads(value) if isinstance(value, str) else value
            result = json.dumps(data)
            # Store in internal variable for assignment
            return self.nextPC()
        except Exception as e:
            raise RuntimeError(self.program, f"JSON encode error: {e}")
    
    # Compile: json decode {value}
    def k_decode(self, command):
        command['value'] = self.nextValue()
        self.add(command)
        return True
    
    # Runtime: json decode {value}
    def r_decode(self, command):
        try:
            value = self.textify(command['value'])
            result = json.loads(value)
            # Return parsed structure
            return self.nextPC()
        except Exception as e:
            raise RuntimeError(self.program, f"JSON decode error: {e}")
```

**Usage in ECS**:
```
use json

variable JSONData
variable Parsed

put `{"name": "Alice", "age": 30}` into JSONData
json decode JSONData into Parsed
log Parsed
```

---

### Example 2: Database Query Plugin

**Goal**: Query a database with syntax `database query from Table giving Result`.

**Reserved check**:
- ✅ `database` not reserved
- ✅ `query` not reserved as command
- ✅ Uses prepositions `from`/`giving` naturally

**Implementation**:

```python
# plugins/database.py
from easycoder.ec_handler import Handler
import sqlite3

class Database(Handler):
    def getName(self):
        return 'database'
    
    def __init__(self, compiler):
        super().__init__(compiler)
        self.connection = None
    
    # Compile: database connect to {server} with {credentials}
    def k_connect(self, command):
        self.skip('to')
        command['server'] = self.nextValue()
        if self.nextIs('with'):
            command['credentials'] = self.nextValue()
        self.add(command)
        return True
    
    # Runtime: database connect
    def r_connect(self, command):
        server = self.textify(command['server'])
        # Connect to database
        self.connection = sqlite3.connect(server)
        return self.nextPC()
    
    # Compile: database query from {table} giving {result}
    def k_query(self, command):
        self.skip('from')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['table'] = record['name']
            self.skip('giving')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                command['result'] = record['name']
                self.add(command)
                return True
        return False
    
    # Runtime: database query
    def r_query(self, command):
        cursor = self.connection.cursor()
        table = self.textify(command['table'])
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        # Store result in variable
        result_var = self.getVariable(command['result'])
        val = self.getSymbolValue(result_var)
        val['type'] = 'list'
        val['content'] = rows
        self.putSymbolValue(result_var, val)
        return self.nextPC()
```

**Usage in ECS**:
```
use database

variable Connection
variable Results

database connect to `/data/app.db` with credentials
database query from Users giving Results
log Results
```

---

### Example 3: Graphics Table Widget Plugin

**Goal**: Extend graphics with a table widget.

**Reserved check**:
- ✅ `table` not in reserved stems
- ✅ Uses `set the column-count of` pattern (safe: "column-count" is namespaced to table context)
- ✅ Integrates with existing graphics `on` event syntax

**Implementation** (stub):

```python
# plugins/table.py
from easycoder.ec_handler import Handler
from PySide6.QtWidgets import QTableWidget

class Table(Handler):
    def getName(self):
        return 'table'
    
    # Compile: table {name}
    def k_table(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            return self.compileVariable(command, 'ECTable')
        return False
    
    # Compile: create Table {params}
    def k_create(self, command):
        # Delegate to graphics create, but handle table-specific attributes
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record['keyword'] == 'table':
                command['name'] = record['name']
                command['rows'] = 10
                command['cols'] = 5
                if self.nextIs('rows'):
                    command['rows'] = self.nextValue()
                if self.nextIs('columns'):
                    command['cols'] = self.nextValue()
                self.add(command)
                return True
        return False
    
    # Compile: set the column-width of Table to {value}
    def k_set(self, command):
        self.skipArticles()
        token = self.nextToken()
        
        if token == 'column-width':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                command['what'] = 'column-width'
                command['widget'] = record['name']
                self.skip('to')
                command['value'] = self.nextValue()
                self.add(command)
                return True
        
        return False
```

**Usage in ECS**:
```
use table

table MyTable
create MyTable rows 20 columns 5

set the column-width of MyTable to 100
set the header-text of MyTable to `Name`, `Age`, `City`

add MyTable to MainLayout

on MyTable cell-selected do HandleCellClick
```

---

## Validation Checklist

Before releasing a plugin, verify:

### 1. Namespace & Collision Check
- [ ] Plugin name is unique and lowercase
- [ ] All commands start with plugin name or use "via {plugin}" pattern
- [ ] No bare keywords that conflict with RESERVED_STEMS.md
- [ ] No value stems that conflict with operations.md
- [ ] Ran `grep -r "{keyword}" RESERVED_STEMS.md` with clean result

### 2. Syntax Consistency
- [ ] Commands use prepositions: `to`, `from`, `with`, `of`, `in`
- [ ] Value expressions use `the {op} of {input}` pattern
- [ ] Optional articles work (tested without "the")
- [ ] Examples in documentation match actual syntax

### 3. Handler Pattern
- [ ] All `k_{keyword}` methods implemented (compilation)
- [ ] All `r_{keyword}` methods implemented (runtime)
- [ ] Plugin-safety comments added to handlers
- [ ] Error messages are clear and actionable

### 4. Testing
- [ ] Plugin compiles with core test suite (`python3 test.py`)
- [ ] Plugin compiles with graphics test suite (`python3 testg.py`)
- [ ] Simple example script works (`plugin_example.ecs`)
- [ ] Error cases handled gracefully (missing params, wrong types, etc.)

### 5. Documentation
- [ ] Plugin README explains syntax with examples
- [ ] All commands documented with syntax and examples
- [ ] Plugin noted in main RESERVED_STEMS.md registry
- [ ] Examples follow EasyCoder conventions (CapitalCase variables, lowercase keywords)

### 6. Code Quality
- [ ] No hardcoded paths or configs
- [ ] Dependencies documented and installed
- [ ] Python 3.9+ compatible (no 3.10+ syntax)
- [ ] Type hints added where reasonable
- [ ] Comments explain non-obvious logic

---

## Collision Detection

### Automated Checks

Run these before publication:

```bash
# Check for conflicting keywords
grep -E "^\s*(put|set|fork|add|remove|create)" plugins/myplugin.py

# Check for conflicting value stems
grep -E "(cat|element|index|property|length)" plugins/myplugin.py

# Check for unqualified command declarations
grep -E "def k_\w+\(self" plugins/myplugin.py | \
    grep -v "k_create\|k_set\|k_add\|k_on"  # These delegate to core

# Lint Python syntax
python3 -m py_compile plugins/myplugin.py
```

### Manual Verification

1. **Check RESERVED_STEMS.md** for your keywords
2. **Check doc/core/values/operations.md** for value stems
3. **Search codebase**: `grep -r "your_keyword" easycoder/`
4. **Run test suite**: Ensure your plugin loads without conflicts
5. **Test with real scripts**: Try your plugin in user code

---

## Best Practices Summary

| Do | Don't |
|----|-------|
| ✅ Use plugin name as namespace | ❌ Use bare verbs that might collide |
| ✅ Use full forms with articles/prepositions | ❌ Use bare word sequences |
| ✅ Document syntax with examples | ❌ Assume users will figure it out |
| ✅ Test with existing test suite | ❌ Only test your plugin in isolation |
| ✅ Follow EasyCoder naming (lowercase keywords) | ❌ Use CamelCase for keywords |
| ✅ Provide clear error messages | ❌ Let exceptions bubble up unchanged |
| ✅ Use skipArticles() for optional "the" | ❌ Require articles in syntax |
| ✅ Check reserved stems BEFORE coding | ❌ Discover conflicts after release |

---

## See Also

- [RESERVED_STEMS.md](RESERVED_STEMS.md) — Reserved command keywords
- [doc/core/values/operations.md](doc/core/values/operations.md) — Reserved value operations
- [doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md) — Graphics-specific patterns
- [SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md) — Refactoring phases and rationale
- `.github/copilot-instructions.md` — Handler development reference
- `plugins/` — Example plugins to study

---

## Contributing Plugins

To contribute a plugin to EasyCoder:

1. Follow this guide completely
2. Add your plugin to the registry in `RESERVED_STEMS.md`
3. Run full test suite: `python3 test.py` and `python3 testg.py`
4. Submit PR with examples and documentation
5. Maintainers will verify collision checks and patterns

---

**Last Updated**: Phase 3 Completion (16 December 2025)  
**Status**: Complete plugin development patterns guide  
**Next Phase**: Phase 4 (LSP Integration & IDE Support)
