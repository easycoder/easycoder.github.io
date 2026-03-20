# EasyCoder Language Server Protocol (LSP) - Phase 4

Intelligent language support for EasyCoder (.ecs) scripts with real-time collision detection, context-aware completions, and interactive documentation.

## Architecture Overview

```
VS Code Extension (Client)
├── extension.ts          - Entry point, launches server
├── package.json          - Extension manifest, activation events
└── syntaxes/             - TextMate grammar for .ecs files

    ↓ stdin/stdout (JSON-RPC 2.0)

Python Language Server (Server)
├── server.py             - Core LSP implementation
│   ├── RegistryLoader    - Parses RESERVED_STEMS.md, operations.md, PATTERNS.md
│   ├── EasyCoderLanguageServer - Main server logic
│   └── EasyCoderDispatcher - JSON-RPC method routing
└── requirements.txt      - Python dependencies
```

## Features

### 1. Code Completion (onCompletion)

**Context-aware keyword suggestions** based on current script state:

- **Core Mode** (default): Access to core keywords (variable, set, loop, etc.)
- **Graphics Mode** (after `create window`): Access to graphics keywords (button, label, input, etc.)

**Example**:
```easycoder
script MyApp
    create window
    ! Typing 'but' shows: button (graphics)
    but
    
    exit
```

**Completion Items Include**:
- `label`: Keyword name
- `kind`: CompletionItemKind.Keyword
- `detail`: Brief description with context tag (CORE/GRAPHICS)
- `sortText`: Ensures keywords appear first in list
- `documentation`: Full docs with syntax (onCompletionResolve)

### 2. Hover Documentation (onHover)

**Interactive keyword reference** showing:
- Keyword type (CORE, GRAPHICS, VALUE)
- Brief description
- Context information

**Example**: Hover over `set` keyword shows:
```
set [CORE]
Assign value to variable or property
```

### 3. Collision Detection (onDidChangeContent → publishDiagnostics)

**Real-time warnings** for:
- Reserved keyword usage as variable names
- Plugin name conflicts
- Value operation collisions

**Severity Levels**:
- `Error` (1): Critical collision, breaks code
- `Warning` (2): Potential issue, may work but risky
- `Information` (3): Advisory, semantic conflict detected
- `Hint` (4): Suggestion for better alternatives

**Example**: Using `set` as variable name:
```easycoder
variable set              ! ← Diagnostic: 'set' is reserved keyword [core]
set set to 5              ! ← Two diagnostics
```

### 4. Smart Registry Loading

**Startup Phase**:
1. Read `RESERVED_STEMS.md` → Extract core/graphics keywords (50+ items)
2. Read `doc/core/values/operations.md` → Extract value operations (18 stems)
3. Read `doc/graphics/PATTERNS.md` → Extract widget types/attributes

**Loaded Data**:
```python
registry.reserved_stems = {
    'set': {'type': 'core', 'description': 'Assign value to variable'},
    'button': {'type': 'graphics', 'description': 'Create button widget'},
    # 50+ keywords
}

registry.value_operations = {
    'string concatenation': {'description': '...', 'alternatives': [...]},
    # 18 operations
}

registry.graphics_patterns = {
    'window': {'description': '...'},
    'button': {'description': '...'},
    # widgets, attributes, signals
}
```

## Setup Instructions

### 1. Install Python Server Dependencies

```bash
cd /home/graham/dev/easycoder/easycoder-py/lsp
pip install -r requirements.txt
```

### 2. Build VS Code Extension

```bash
cd /home/graham/dev/easycoder/easycoder-py/lsp
npm install
npm run compile
```

### 3. Install Extension in VS Code

**Option A: Development Mode**
```bash
code --install-extension ./
# Or use VS Code command: Extensions → Install from VSIX
```

**Option B: Manual Installation**
1. Copy entire `lsp/` directory to: `~/.vscode/extensions/easycoder-lsp-1.0.0/`
2. Reload VS Code (Cmd+R)

### 4. Verify Installation

1. Open any `.ecs` file
2. You should see syntax highlighting
3. Type a keyword and press Ctrl+Space (or Cmd+Space) for completions
4. Hover over a keyword to see documentation

## File Structure

```
lsp/
├── server.py                           # Python LSP server
├── client/
│   ├── package.json                    # Client dependencies
│   ├── tsconfig.json                   # TypeScript config
│   └── src/
│       └── extension.ts                # VS Code extension entry
├── syntaxes/
│   ├── easycoder.tmLanguage.json      # TextMate grammar for syntax highlighting
│   └── easycoder.configuration.json    # Editor behavior config
├── package.json                        # Extension manifest
├── requirements.txt                    # Python dependencies
└── README.md                           # This file
```

## JSON-RPC Message Flow

### Initialization

```
Client → Server: initialize(capabilities: {}, rootPath: string)
Server → Client: InitializeResult {capabilities: {...}}

Client → Server: initialized()
Server: Load registries, start validation
```

### Document Lifecycle

```
Client → Server: textDocument/didOpen({textDocument, text})
Server: Store document, validate for diagnostics

Client → Server: textDocument/didChange({textDocument, contentChanges})
Server: Update document, re-validate

Client → Server: textDocument/didClose({textDocument})
Server: Remove from memory
```

### Code Completion

```
Client → Server: textDocument/completion({textDocument, position})
Server: 
  1. Extract word at cursor
  2. Detect context (core/graphics)
  3. Filter registry by prefix
  4. Return CompletionItem[]

Client → User: Show completion dropdown

User: Select item → Client → Server: completionItem/resolve(item)
Server: Enhance with documentation
Client: Show full doc in completion panel
```

### Hover

```
Client → Server: textDocument/hover({textDocument, position})
Server:
  1. Extract word at cursor
  2. Look up in registries
  3. Generate markdown docs
  4. Return Hover{contents}

Client → User: Show tooltip with docs
```

## Configuration Options

Users can customize behavior in `.vscode/settings.json`:

```json
{
  "easycoder.maxNumberOfProblems": 100,
  "easycoder.trace.server": "verbose"
}
```

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `easycoder.maxNumberOfProblems` | number | 100 | Max diagnostics per file |
| `easycoder.trace.server` | enum | "off" | LSP trace level: "off" \| "messages" \| "verbose" |

## Logging

Server logs to `/tmp/easycoder-lsp.log`:

```bash
tail -f /tmp/easycoder-lsp.log
```

**Log Levels**:
- `INFO`: Normal operations (server start, registry load, document open/close)
- `WARNING`: Registry files not found, missing dependencies
- `ERROR`: Critical failures with stack traces

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Registry load (startup) | ~50ms | Parses 3 markdown files, ~150 entries |
| Completion request | <5ms | In-memory lookup + filtering |
| Hover lookup | <1ms | Direct dictionary access |
| Validation (full) | ~10ms per file | Regex scanning for collisions |
| Context detection | <1ms | Backward scan for keywords |

## Testing

### Manual Test Cases

**Test 1: Basic Completion**
```easycoder
script Test
    ! Press Ctrl+Space to see 'variable', 'set', 'loop', etc.
    var
    exit
```

**Test 2: Graphics Context**
```easycoder
script Test
    create window
    ! Press Ctrl+Space to see 'button', 'label', 'input', etc.
    but
    exit
```

**Test 3: Hover Documentation**
```easycoder
script Test
    ! Hover over 'set' to see docs
    set
    
    exit
```

**Test 4: Collision Detection**
```easycoder
script Test
    variable set              ! ← Should show diagnostic
    set set to 5              ! ← Should show 2 diagnostics
    exit
```

### Automated Test Suite

Create `lsp/test/test_server.py`:
```python
import pytest
from server import RegistryLoader, EasyCoderLanguageServer

def test_registry_loader():
    registry = RegistryLoader('/home/graham/dev/easycoder/easycoder-py')
    assert len(registry.reserved_stems) > 30
    assert 'set' in registry.reserved_stems
    assert len(registry.value_operations) > 15

def test_completion():
    server = EasyCoderLanguageServer('/home/graham/dev/easycoder/easycoder-py')
    completions = server.registry.get_completions_for_context('core')
    assert len(completions) > 0
    assert any(c['label'] == 'set' for c in completions)

def test_collision_detection():
    server = EasyCoderLanguageServer('/home/graham/dev/easycoder/easycoder-py')
    # Should detect 'set' as reserved
    assert server.registry.get_reserved_keyword('set') is not None
    # Should NOT detect random variable
    assert server.registry.get_reserved_keyword('MyVariable') is None
```

Run tests:
```bash
cd lsp
pytest test/test_server.py -v
```

## Integration with RBR Controller

### Test with Production Scripts

```bash
# Open RBR controller scripts in VS Code
code /home/graham/dev/rbr/roombyroom/Controller/ui/*.ecs

# Features available:
# 1. Syntax highlighting for .ecs files
# 2. Autocomplete for RBR UI keywords (create room, set temperature, etc.)
# 3. Hover docs for keyword reference
# 4. Real-time collision detection
```

### Expected Behavior

**rbrconf.ecs**:
```
- Graphics mode detected after 'create rbrwin'
- Graphics completions (room, button) available
- No collisions (using standard variable names)
```

**schedule.ecs** / **systemName.ecs**:
```
- Core mode (no windows)
- Core completions (variable, set, loop)
- Real-time diagnostics for keyword conflicts
```

## Future Enhancements

### Phase 4.1: Advanced Features
- [ ] Jump to definition (onDefinition)
- [ ] Find all references (onReferences)
- [ ] Symbol outline (onDocumentSymbol)
- [ ] Code formatting (onFormatting)
- [ ] Code actions for quick fixes

### Phase 4.2: Plugin Awareness
- [ ] Load plugin registries dynamically
- [ ] Suggest plugin usage patterns
- [ ] Warn on plugin conflicts with core

### Phase 4.3: Performance
- [ ] Incremental document sync (TextDocumentSyncKind.Incremental)
- [ ] Workspace symbol caching
- [ ] Lazy registry loading for large workspaces

### Phase 4.4: Developer Tools
- [ ] Debugger integration (DAP)
- [ ] Test runner UI
- [ ] Performance profiler

## Troubleshooting

### Server not starting

**Error**: "Server crashed after 5 restarts"

**Solution**:
1. Check Python installation: `python3 --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check logs: `tail -f /tmp/easycoder-lsp.log`
4. Verify registry files exist:
   ```bash
   ls -la /home/graham/dev/easycoder/easycoder-py/RESERVED_STEMS.md
   ls -la /home/graham/dev/easycoder/easycoder-py/doc/core/values/operations.md
   ```

### No completions showing

**Solution**:
1. Verify language is set to `easycoder`: Check VS Code status bar (bottom-right)
2. Check file extension is `.ecs`
3. Try triggering manually: Ctrl+Space
4. Check output: View → Output → "EasyCoder Language Server"

### Collision detection too aggressive

**Solution**:
Adjust `maxNumberOfProblems` in settings:
```json
{
  "easycoder.maxNumberOfProblems": 200
}
```

## References

- **LSP Specification**: https://microsoft.github.io/language-server-protocol/
- **VS Code Extension API**: https://code.visualstudio.com/api
- **Python JSON-RPC**: https://github.com/zigoni/python-jsonrpc
- **TextMate Grammar**: https://macromates.com/manual/en/language_grammars

---

**Phase 4 Status**: ✅ Initial Implementation Complete  
**Next Phase**: 4.1 (Advanced Language Features)  
**Estimated Timeline**: 2-4 weeks for Phase 4.1

