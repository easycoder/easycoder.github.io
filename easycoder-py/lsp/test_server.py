#!/usr/bin/env python3
"""
Test suite for EasyCoder Language Server

Run with: pytest test_server.py -v
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from server import (
    RegistryLoader,
    EasyCoderLanguageServer,
    DiagnosticSeverity,
    CompletionItemKind
)


class TestRegistryLoader:
    """Test registry file parsing"""

    @pytest.fixture
    def workspace_root(self):
        """Use actual workspace for tests"""
        return '/home/graham/dev/easycoder/easycoder-py'

    @pytest.fixture
    def registry(self, workspace_root):
        return RegistryLoader(workspace_root)

    def test_load_reserved_stems(self, registry):
        """Test RESERVED_STEMS.md parsing"""
        assert len(registry.reserved_stems) > 30
        assert 'set' in registry.reserved_stems
        assert registry.reserved_stems['set']['type'] in ['core', 'graphics']

    def test_load_value_operations(self, registry):
        """Test operations.md parsing"""
        assert len(registry.value_operations) > 15
        # Check specific operations are loaded
        assert any('string' in op.lower() for op in registry.value_operations)

    def test_load_graphics_patterns(self, registry):
        """Test PATTERNS.md parsing"""
        # Should load at least some graphics patterns if file exists
        # May be empty if PATTERNS.md not fully populated
        assert isinstance(registry.graphics_patterns, dict)

    def test_get_reserved_keyword(self, registry):
        """Test keyword lookup"""
        result = registry.get_reserved_keyword('set')
        assert result is not None
        assert 'type' in result
        assert 'description' in result

    def test_get_reserved_keyword_not_found(self, registry):
        """Test keyword lookup for non-reserved word"""
        result = registry.get_reserved_keyword('MyVariable')
        assert result is None

    def test_get_completions_for_context_core(self, registry):
        """Test core context completions"""
        completions = registry.get_completions_for_context('core')
        assert len(completions) > 0
        assert all(c['kind'] == CompletionItemKind.Keyword.value for c in completions)

    def test_get_completions_for_context_graphics(self, registry):
        """Test graphics context completions"""
        completions = registry.get_completions_for_context('graphics')
        assert isinstance(completions, list)
        # May be empty depending on what's in RESERVED_STEMS.md

    def test_get_completions_all(self, registry):
        """Test all completions"""
        completions = registry.get_completions_for_context('all')
        assert len(completions) > 30
        # All should be keyword type
        assert all(c['kind'] == CompletionItemKind.Keyword.value for c in completions)


class TestEasyCoderLanguageServer:
    """Test language server functionality"""

    @pytest.fixture
    def workspace_root(self):
        return '/home/graham/dev/easycoder/easycoder-py'

    @pytest.fixture
    def server(self, workspace_root):
        return EasyCoderLanguageServer(workspace_root)

    def test_initialize(self, server):
        """Test server initialization"""
        result = server.initialize({})
        assert 'capabilities' in result
        assert 'textDocumentSync' in result['capabilities']
        assert 'completionProvider' in result['capabilities']

    def test_initialize_with_workspace(self, server):
        """Test initialization with workspace root"""
        result = server.initialize({'rootPath': '/tmp'})
        assert 'capabilities' in result

    def test_text_document_did_open(self, server):
        """Test document open notification"""
        params = {
            'textDocument': {
                'uri': 'file:///test.ecs',
                'text': 'script Test\nexit\n',
                'version': 1
            }
        }
        server.text_document_did_open(params)
        assert 'file:///test.ecs' in server.documents
        assert server.documents['file:///test.ecs']['text'] == 'script Test\nexit\n'

    def test_text_document_did_change(self, server):
        """Test document change notification"""
        # First open
        params_open = {
            'textDocument': {
                'uri': 'file:///test.ecs',
                'text': 'script Test\n',
                'version': 1
            }
        }
        server.text_document_did_open(params_open)

        # Then change
        params_change = {
            'textDocument': {'uri': 'file:///test.ecs', 'version': 2},
            'contentChanges': [{'text': 'script Test\nexit\n'}]
        }
        server.text_document_did_change(params_change)
        assert server.documents['file:///test.ecs']['text'] == 'script Test\nexit\n'
        assert server.documents['file:///test.ecs']['version'] == 2

    def test_text_document_did_close(self, server):
        """Test document close notification"""
        # Open first
        params_open = {
            'textDocument': {
                'uri': 'file:///test.ecs',
                'text': 'script Test\nexit\n',
                'version': 1
            }
        }
        server.text_document_did_open(params_open)
        assert 'file:///test.ecs' in server.documents

        # Then close
        params_close = {'textDocument': {'uri': 'file:///test.ecs'}}
        server.text_document_did_close(params_close)
        assert 'file:///test.ecs' not in server.documents

    def test_text_document_completion_empty(self, server):
        """Test completion with no open document"""
        params = {
            'textDocument': {'uri': 'file:///nonexistent.ecs'},
            'position': {'line': 0, 'character': 0}
        }
        result = server.text_document_completion(params)
        assert result['items'] == []

    def test_text_document_completion_basic(self, server):
        """Test basic completion"""
        # Open document
        params_open = {
            'textDocument': {
                'uri': 'file:///test.ecs',
                'text': 'set',
                'version': 1
            }
        }
        server.text_document_did_open(params_open)

        # Request completion
        params = {
            'textDocument': {'uri': 'file:///test.ecs'},
            'position': {'line': 0, 'character': 3}
        }
        result = server.text_document_completion(params)
        assert 'items' in result
        assert result['isIncomplete'] == False
        # Should have suggestions starting with 'set'
        assert any(item['label'].lower().startswith('set') for item in result['items'])

    def test_completion_item_resolve(self, server):
        """Test completion item resolution with docs"""
        item = {'label': 'set', 'kind': 14}
        result = server.completion_item_resolve(item)
        assert 'documentation' in result
        assert result['documentation']['kind'] == 'markdown'
        assert len(result['documentation']['value']) > 0

    def test_text_document_hover_no_document(self, server):
        """Test hover on non-existent document"""
        params = {
            'textDocument': {'uri': 'file:///nonexistent.ecs'},
            'position': {'line': 0, 'character': 0}
        }
        result = server.text_document_hover(params)
        assert result is None

    def test_text_document_hover_on_keyword(self, server):
        """Test hover on reserved keyword"""
        # Open document
        params_open = {
            'textDocument': {
                'uri': 'file:///test.ecs',
                'text': 'set MyVar to 5',
                'version': 1
            }
        }
        server.text_document_did_open(params_open)

        # Hover on 'set'
        params = {
            'textDocument': {'uri': 'file:///test.ecs'},
            'position': {'line': 0, 'character': 2}  # Within 'set'
        }
        result = server.text_document_hover(params)
        assert result is not None
        assert 'contents' in result
        assert 'value' in result['contents']
        assert 'set' in result['contents']['value'].lower()

    def test_detect_context_graphics_after_create(self, server):
        """Test graphics context detection"""
        text = 'script Test\ncreate window\n'
        position = {'line': 2, 'character': 0}
        context = server._detect_context(text, position)
        assert context == 'graphics'

    def test_detect_context_core_by_default(self, server):
        """Test core context detection by default"""
        text = 'script Test\nvariable X\n'
        position = {'line': 1, 'character': 0}
        context = server._detect_context(text, position)
        assert context == 'core'

    def test_get_keyword_docs(self, server):
        """Test documentation generation"""
        info = {'type': 'core', 'description': 'Test keyword'}
        docs = server._get_keyword_docs('test', info)
        assert '**test**' in docs
        assert 'CORE' in docs
        assert 'Test keyword' in docs


class TestDiagnosticSeverity:
    """Test diagnostic severity enum"""

    def test_error_severity(self):
        assert DiagnosticSeverity.Error.value == 1

    def test_warning_severity(self):
        assert DiagnosticSeverity.Warning.value == 2

    def test_information_severity(self):
        assert DiagnosticSeverity.Information.value == 3

    def test_hint_severity(self):
        assert DiagnosticSeverity.Hint.value == 4


class TestCompletionItemKind:
    """Test completion item kind enum"""

    def test_keyword_kind(self):
        assert CompletionItemKind.Keyword.value == 14

    def test_variable_kind(self):
        assert CompletionItemKind.Variable.value == 6


class TestIntegration:
    """Integration tests simulating real usage"""

    @pytest.fixture
    def server(self):
        return EasyCoderLanguageServer('/home/graham/dev/easycoder/easycoder-py')

    def test_full_workflow(self, server):
        """Test complete workflow: open, edit, complete, hover, close"""
        uri = 'file:///integration_test.ecs'

        # 1. Initialize
        caps = server.initialize({'rootPath': '/tmp'})
        assert caps['capabilities']['completionProvider'] is not None

        # 2. Open document
        server.text_document_did_open({
            'textDocument': {
                'uri': uri,
                'text': 'script Test\nset MyVar to 5\nexit\n',
                'version': 1
            }
        })
        assert uri in server.documents

        # 3. Request completions
        completions = server.text_document_completion({
            'textDocument': {'uri': uri},
            'position': {'line': 0, 'character': 3}
        })
        assert len(completions['items']) > 0

        # 4. Resolve a completion item
        item = completions['items'][0]
        resolved = server.completion_item_resolve(item)
        assert 'documentation' in resolved

        # 5. Request hover on 'set'
        hover = server.text_document_hover({
            'textDocument': {'uri': uri},
            'position': {'line': 1, 'character': 2}
        })
        assert hover is not None

        # 6. Close document
        server.text_document_did_close({'textDocument': {'uri': uri}})
        assert uri not in server.documents


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
