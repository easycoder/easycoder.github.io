# EasyCoder LSP - Quick Start & Deployment

## 30-Second Setup

### For Users

1. **Install the Extension**
   ```bash
   code --install-extension /home/graham/dev/easycoder/easycoder-py/lsp
   ```

2. **Reload VS Code**
   - Press `Cmd+R` (Mac) or `Ctrl+R` (Linux/Windows)

3. **Open a .ecs file and start coding**
   - Syntax highlighting ✅
   - Ctrl+Space for completions ✅
   - Hover for docs ✅

### For Developers

```bash
# Build
cd /home/graham/dev/easycoder/easycoder-py/lsp
npm install
npm run compile

# Test
python3 -m pytest test/

# Debug
code --extensionDevelopmentPath=$PWD
```

## File Organization

```
lsp/
├── server.py                 # Python LSP server (core logic)
├── client/
│   └── src/extension.ts      # VS Code extension client
├── syntaxes/                 # TextMate grammar
├── package.json              # Extension manifest
├── requirements.txt          # Python deps
├── LSP_ARCHITECTURE.md       # Full technical docs
└── QUICK_START.md           # This file
```

## Key Features

| Feature | Status | Trigger |
|---------|--------|---------|
| Syntax Highlighting | ✅ | Auto (TextMate grammar) |
| Code Completion | ✅ | Ctrl+Space |
| Hover Docs | ✅ | Hover over keyword |
| Collision Detection | ✅ | Real-time (red squiggles) |
| Context Detection | ✅ | Auto (core/graphics mode) |

## Architecture

```
┌─────────────────────────────┐
│    VS Code Editor           │
│  (extension.ts client)      │
└────────────┬────────────────┘
             │ stdin/stdout
             │ JSON-RPC 2.0
             ↓
┌─────────────────────────────┐
│   Python LSP Server         │
│  (server.py)                │
│  ├─ RegistryLoader          │
│  ├─ EasyCoderLanguageServer │
│  └─ Dispatcher              │
└─────────────────────────────┘
             │ Read
             ↓
┌─────────────────────────────┐
│   Registry Files            │
│  ├─ RESERVED_STEMS.md       │
│  ├─ operations.md           │
│  └─ PATTERNS.md             │
└─────────────────────────────┘
```

## Configuration

Edit `.vscode/settings.json`:

```json
{
  "easycoder.maxNumberOfProblems": 100,
  "easycoder.trace.server": "verbose"
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Server crashed" | `pip install -r requirements.txt` |
| No completions | Check file ends with `.ecs` |
| Wrong syntax highlighting | Reload VS Code (Cmd/Ctrl+R) |
| Can't find extension | Run: `code --install-extension ./lsp` |

## Verify Installation

```bash
# Check Python server works
python3 lsp/server.py /home/graham/dev/easycoder/easycoder-py

# Check logs
tail -f /tmp/easycoder-lsp.log
```

## Next Steps

- Read [LSP_ARCHITECTURE.md](LSP_ARCHITECTURE.md) for full details
- Run tests: `pytest lsp/test/ -v`
- Test with RBR scripts: `code /home/graham/dev/rbr/roombyroom/Controller/ui/*.ecs`

## Support

- **Issues**: Check logs at `/tmp/easycoder-lsp.log`
- **Docs**: [VS Code Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- **Protocol**: [LSP Specification](https://microsoft.github.io/language-server-protocol/)

---

**Status**: Phase 4 - Initial Implementation ✅  
**Version**: 1.0.0  
**Last Updated**: 16 December 2025
