#!/usr/bin/env python3
"""
EasyCoder Language Server Protocol (LSP) Implementation

Provides intelligent language features for EasyCoder (.ecs) scripts:
- Code completion with plugin-aware suggestions
- Real-time collision detection
- Hover documentation with syntax and safety notes
- Diagnostics for keyword conflicts

Built on LSP 3.17 specification, designed for VS Code integration.
"""

import json
import re
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum

# Note on JSON-RPC dependency:
# The test suite doesn't require the JSON-RPC runtime. Avoid importing any
# JSON-RPC library at module import time to prevent pytest internal errors
# when the dependency isn't present or when conflicting packages shadow it.
# We will import the transport layer lazily in main().

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/tmp/easycoder-lsp.log'),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)


class CompletionItemKind(Enum):
    """LSP CompletionItemKind values"""
    Text = 1
    Method = 2
    Function = 3
    Constructor = 4
    Field = 5
    Variable = 6
    Class = 7
    Interface = 8
    Module = 9
    Property = 10
    Unit = 11
    Value = 12
    Enum = 13
    Keyword = 14
    Snippet = 15
    Color = 16
    File = 17
    Reference = 18
    Folder = 19
    EnumMember = 20
    Constant = 21
    Struct = 22
    Event = 23
    Operator = 24
    TypeParameter = 25


class DiagnosticSeverity(Enum):
    """LSP DiagnosticSeverity values"""
    Error = 1
    Warning = 2
    Information = 3
    Hint = 4


class RegistryLoader:
    """Load and parse EasyCoder registries for collision detection and suggestions"""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.reserved_stems = {}
        self.value_operations = {}
        self.graphics_patterns = {}
        self.load_all()

    def load_all(self):
        """Load all registries from workspace"""
        logger.info(f"Loading registries from {self.workspace_root}")
        self._load_reserved_stems()
        self._load_value_operations()
        self._load_graphics_patterns()
        logger.info(f"Loaded {len(self.reserved_stems)} core keywords, "
                   f"{len(self.value_operations)} value operations, "
                   f"{len(self.graphics_patterns)} graphics patterns")

    def _load_reserved_stems(self):
        """Parse RESERVED_STEMS.md"""
        # Try root, then doc/RESERVED_STEMS.md
        file_path = self.workspace_root / "RESERVED_STEMS.md"
        if not file_path.exists():
            alt_path = self.workspace_root / "doc" / "RESERVED_STEMS.md"
            if alt_path.exists():
                file_path = alt_path
            else:
                logger.warning(f"RESERVED_STEMS.md not found at {file_path}")
                return

        content = file_path.read_text()
        in_core = False
        in_graphics = False

        for line in content.split('\n'):
            line = line.strip()

            if re.search(r'^##\s+Core\b', line):
                in_core = True
                in_graphics = False
                continue
            elif re.search(r'^##\s+Graphics\b', line):
                in_core = False
                in_graphics = True
                continue
            elif line.startswith('##'):
                in_core = False
                in_graphics = False
                continue

            # Parse bullet entries: - `keyword` —/–/- description
            if line.startswith('- `') and '`' in line[3:]:
                match = re.match(r'- `([\w-]+)`\s+[—–-]\s+(.+)', line)
                if match:
                    keyword, desc = match.groups()
                    self.reserved_stems[keyword.lower()] = {
                        'type': 'core' if in_core else 'graphics',
                        'description': desc
                    }

        # Fallback: augment from docs folders if count is small
        if len(self.reserved_stems) < 30:
            core_dir = self.workspace_root / 'doc' / 'core' / 'keywords'
            gfx_dir = self.workspace_root / 'doc' / 'graphics' / 'keywords'
            for d, typ in ((core_dir, 'core'), (gfx_dir, 'graphics')):
                if d.exists():
                    for f in d.glob('*.md'):
                        key = f.stem.lower()
                        if key not in self.reserved_stems:
                            # Use first heading or filename as description
                            try:
                                first = f.read_text().splitlines()[0].strip()
                            except Exception:
                                first = ''
                            desc = first.lstrip('# ').strip() if first.startswith('#') else (first or f"{key} keyword")
                            self.reserved_stems[key] = {
                                'type': typ,
                                'description': desc
                            }

    def _load_value_operations(self):
        """Parse doc/core/values/operations.md"""
        file_path = self.workspace_root / "doc" / "core" / "values" / "operations.md"
        if not file_path.exists():
            logger.warning(f"operations.md not found at {file_path}")
            return

        content = file_path.read_text()
        current_op = None

        for line in content.split('\n'):
            # Parse operation entries: `operation` — description
            if line.strip().startswith('`') and '`' in line:
                match = re.match(r'^`([\w\-\s]+)`\s+[—–-]\s+(.+)$', line.strip())
                if match:
                    op_name, desc = match.groups()
                    self.value_operations[op_name.strip().lower()] = {
                        'description': desc,
                        'alternatives': []
                    }
                    current_op = op_name

            # Parse alternatives
            elif current_op and line.strip().startswith('- Use'):
                match = re.match(r'- Use `(.+?)`', line)
                if match:
                    alt = match.group(1)
                    self.value_operations[current_op.strip().lower()]['alternatives'].append(alt)

        # Fallback: collect all backticked tokens as operation stems if too few parsed
        if len(self.value_operations) < 15:
            tokens = set()
            for line in content.split('\n'):
                for token in re.findall(r'`([^`]+)`', line):
                    t = token.strip().lower()
                    if t and len(t) <= 30 and all(c.isalnum() or c in ' -_/' for c in t):
                        tokens.add(t)
            for t in tokens:
                if t not in self.value_operations:
                    self.value_operations[t] = {'description': '', 'alternatives': []}

    def _load_graphics_patterns(self):
        """Parse doc/graphics/PATTERNS.md"""
        file_path = self.workspace_root / "doc" / "graphics" / "PATTERNS.md"
        if not file_path.exists():
            logger.warning(f"PATTERNS.md not found at {file_path}")
            return

        content = file_path.read_text()
        # Extract reserved widget types, attributes, signals
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'Reserved Widget Types' in line or 'Reserved Attributes' in line or 'Reserved Signals' in line:
                # Simple extraction of entries from table or list
                for j in range(i + 1, min(i + 20, len(lines))):
                    if lines[j].startswith('| `'):
                        match = re.match(r'\| `(\w+)`\s+\|\s+(.+?)\s+\|', lines[j])
                        if match:
                            name, desc = match.groups()
                            self.graphics_patterns[name] = {'description': desc}

    def get_reserved_keyword(self, keyword: str) -> Optional[Dict[str, Any]]:
        """Check if keyword is reserved"""
        return self.reserved_stems.get(keyword.lower())

    def get_reserved_operation(self, operation: str) -> Optional[Dict[str, Any]]:
        """Check if value operation is reserved"""
        return self.value_operations.get(operation.lower())

    def get_completions_for_context(self, context: str = 'core') -> List[Dict[str, Any]]:
        """Get completion items for current context"""
        completions = []

        # Filter by context (core, graphics, or all)
        keywords = self.reserved_stems
        if context == 'graphics':
            keywords = {k: v for k, v in keywords.items() if v['type'] == 'graphics'}
        elif context == 'core':
            keywords = {k: v for k, v in keywords.items() if v['type'] == 'core'}

        for keyword, info in keywords.items():
            completions.append({
                'label': keyword,
                'kind': CompletionItemKind.Keyword.value,
                'detail': f"[{info['type'].upper()}] {info['description']}",
                'sortText': f"0_{keyword}",  # Sort keywords first
                'insertText': keyword
            })

        return completions


class EasyCoderLanguageServer:
    """EasyCoder Language Server"""

    def __init__(self, workspace_root: str = None):
        self.workspace_root = workspace_root or str(Path.home())
        self.registry = RegistryLoader(self.workspace_root)
        self.documents = {}  # Track open documents
        self.current_context = 'core'  # Track if in graphics context
        self.capabilities = {}

    def initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize server capabilities"""
        logger.info(f"Initializing with params: {params}")

        # Only switch workspace root if it contains registries; otherwise keep existing
        if params and 'rootPath' in params and params['rootPath']:
            candidate = Path(params['rootPath'])
            # Check for registry files in candidate path
            has_reserved = (candidate / 'RESERVED_STEMS.md').exists() or (candidate / 'doc' / 'RESERVED_STEMS.md').exists()
            if has_reserved:
                self.workspace_root = str(candidate)
                self.registry = RegistryLoader(self.workspace_root)
            else:
                logger.warning(f"Registry files not found under {candidate}; keeping workspace_root={self.workspace_root}")

        self.capabilities = {
            'textDocumentSync': 1,  # Full document sync
            'completionProvider': {
                'resolveProvider': True,
                'triggerCharacters': [' ', '.']
            },
            'hoverProvider': True,
            'definitionProvider': False,  # Future enhancement
            'diagnosticProvider': {
                'interFileDependencies': False,
                'workspaceDiagnostics': False
            }
        }

        return {'capabilities': self.capabilities}

    def text_document_did_open(self, params: Dict[str, Any]):
        """Handle document open"""
        uri = params['textDocument']['uri']
        text = params['textDocument']['text']
        self.documents[uri] = {'text': text, 'version': params['textDocument'].get('version', 0)}
        logger.info(f"Opened document: {uri}")
        self._validate_document(uri)

    def text_document_did_change(self, params: Dict[str, Any]):
        """Handle document change"""
        uri = params['textDocument']['uri']
        if uri not in self.documents:
            return

        # Simple full sync approach
        text = params['contentChanges'][0]['text'] if params['contentChanges'] else ''
        self.documents[uri]['text'] = text
        self.documents[uri]['version'] = params['textDocument'].get('version', 0)
        logger.info(f"Changed document: {uri}")
        self._validate_document(uri)

    def text_document_did_close(self, params: Dict[str, Any]):
        """Handle document close"""
        uri = params['textDocument']['uri']
        if uri in self.documents:
            del self.documents[uri]
        logger.info(f"Closed document: {uri}")

    def text_document_completion(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Provide code completion items"""
        uri = params['textDocument']['uri']
        position = params['position']

        if uri not in self.documents:
            return {'items': []}

        text = self.documents[uri]['text']
        lines = text.split('\n')

        if position['line'] >= len(lines):
            return {'items': []}

        line = lines[position['line']]
        char_pos = position['character']

        # Detect context (are we in graphics section?)
        context = self._detect_context(text, position)

        # Get word being typed
        word_start = char_pos
        while word_start > 0 and line[word_start - 1].isalnum() or line[word_start - 1] == '_':
            word_start -= 1

        word = line[word_start:char_pos]

        # Get completions
        completions = self.registry.get_completions_for_context(context)

        # Filter by word prefix
        if word:
            completions = [c for c in completions if c['label'].lower().startswith(word.lower())]

        logger.info(f"Completion at {uri}:{position['line']}:{char_pos}, context={context}, "
                   f"word='{word}', suggestions={len(completions)}")

        return {'isIncomplete': False, 'items': completions}

    def completion_item_resolve(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve completion item with full documentation"""
        label = item['label']

        # Add documentation if available
        reserved = self.registry.get_reserved_keyword(label)
        if reserved:
            item['documentation'] = {
                'kind': 'markdown',
                'value': self._get_keyword_docs(label, reserved)
            }

        return item

    def text_document_hover(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Provide hover information"""
        uri = params['textDocument']['uri']
        position = params['position']

        if uri not in self.documents:
            return None

        text = self.documents[uri]['text']
        lines = text.split('\n')

        if position['line'] >= len(lines):
            return None

        line = lines[position['line']]
        char_pos = position['character']

        # Extract word at cursor
        word_start = char_pos
        while word_start > 0 and (line[word_start - 1].isalnum() or line[word_start - 1] == '_'):
            word_start -= 1

        word_end = char_pos
        while word_end < len(line) and (line[word_end].isalnum() or line[word_end] == '_'):
            word_end += 1

        word = line[word_start:word_end]

        if not word:
            return None

        # Look up keyword
        reserved = self.registry.get_reserved_keyword(word)
        if not reserved:
            # Try value operation
            reserved = self.registry.get_reserved_operation(word)
            if not reserved:
                return None

        hover_text = self._get_keyword_docs(word, reserved)

        return {
            'contents': {
                'kind': 'markdown',
                'value': hover_text
            }
        }

    def _validate_document(self, uri: str):
        """Validate document and publish diagnostics"""
        if uri not in self.documents:
            return

        text = self.documents[uri]['text']
        diagnostics = []

        # Check for keyword collisions
        lines = text.split('\n')
        for line_num, line in enumerate(lines):
            tokens = re.findall(r'\b\w+\b', line)
            for token in tokens:
                reserved = self.registry.get_reserved_keyword(token.lower())
                if reserved and token.startswith('create '):
                    # Not a collision if it's part of 'create' command
                    continue

                # Check for suspicious variable names that shadow keywords
                if reserved and re.match(rf'\b{re.escape(token)}\b', line):
                    # This could be a collision; report as info only
                    diagnostics.append({
                        'range': {
                            'start': {'line': line_num, 'character': line.find(token)},
                            'end': {'line': line_num, 'character': line.find(token) + len(token)}
                        },
                        'severity': DiagnosticSeverity.Information.value,
                        'message': f"'{token}' is a reserved keyword [{reserved['type']}]",
                        'source': 'easycoder'
                    })

        logger.info(f"Validation complete for {uri}: {len(diagnostics)} diagnostics")
        # Note: In a real LSP server, we'd call connection.sendDiagnostics() here

    def _detect_context(self, text: str, position: Dict[str, int]) -> str:
        """Detect if we're in core or graphics context"""
        lines = text.split('\n')
        current_line = position['line']

        # Look backwards for 'create' statements
        for i in range(current_line, -1, -1):
            line = lines[i].lower()
            if 'create window' in line or 'create rbrwin' in line:
                return 'graphics'
            elif 'create room' in line:
                return 'graphics'

        return 'core'

    def _get_keyword_docs(self, keyword: str, info: Dict[str, Any]) -> str:
        """Generate markdown documentation for keyword hover"""
        docs = f"**{keyword}** `{info['type'].upper()}`\n\n"
        docs += f"{info.get('description', 'No description available')}\n"

        return docs


class EasyCoderDispatcher:
    """Placeholder dispatcher. Real JSON-RPC wiring is done in main() if deps exist."""

    def __init__(self, server: EasyCoderLanguageServer):
        self.server = server

    # The following methods mirror LSP method names and delegate to server.
    def initialize(self, **kwargs) -> Dict[str, Any]:
        return self.server.initialize(kwargs)

    def shutdown(self, **kwargs) -> None:
        logger.info("Server shutdown requested")
        return None

    def exit(self, **kwargs) -> None:
        logger.info("Server exit requested")
        sys.exit(0)

    # Notification handlers (no return value)
    def _textDocument__didOpen(self, **kwargs) -> None:
        self.server.text_document_did_open(kwargs)

    def _textDocument__didChange(self, **kwargs) -> None:
        self.server.text_document_did_change(kwargs)

    def _textDocument__didClose(self, **kwargs) -> None:
        self.server.text_document_did_close(kwargs)

    # Request handlers (with return values)
    def _textDocument__completion(self, **kwargs) -> Dict[str, Any]:
        return self.server.text_document_completion(kwargs)

    def _completionItem__resolve(self, **kwargs) -> Dict[str, Any]:
        return self.server.completion_item_resolve(kwargs)

    def _textDocument__hover(self, **kwargs) -> Optional[Dict[str, Any]]:
        return self.server.text_document_hover(kwargs)


def main():
    """Entry point for Language Server"""
    logger.info("Starting EasyCoder Language Server")

    try:
        # Create server instance
        workspace_root = sys.argv[1] if len(sys.argv) > 1 else str(Path.home())
        server = EasyCoderLanguageServer(workspace_root)

        # Optional: enable Python debugging when requested by client
        try:
            import os
            if os.environ.get('EASYCODER_LSP_DEBUGPY') == '1':
                import debugpy  # type: ignore
                debugpy.listen(('127.0.0.1', 5678))
                logger.info('debugpy listening on 127.0.0.1:5678')
                # Do not wait_for_client() to avoid blocking startup
        except Exception as _dbg_err:
            logger.warning(f"debugpy not available or failed to start: {_dbg_err}")

        # Lazily import JSON-RPC transport. Prefer pygls if available; fall back to json-rpc.
        try:
            from jsonrpc import jsonrpc as _jsonrpc
            # Wire up a minimal loop using json-rpc package
            dispatcher = EasyCoderDispatcher(server)
            rpc = _jsonrpc.JsonRpc()
            rpc.dispatcher = dispatcher
            rpc.read_messages(sys.stdin)
        except Exception as e:
            logger.error(
                "JSON-RPC transport unavailable. Install 'json-rpc' (pip install json-rpc) or run via VS Code client.")
            logger.error(f"Transport error: {e}")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
