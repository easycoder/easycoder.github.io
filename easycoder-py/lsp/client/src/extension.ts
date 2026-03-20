import * as path from 'path';
import * as fs from 'fs';
import { workspace, ExtensionContext, window, ExtensionMode } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath || '';

  // Start Python language server using python-languageserver bridge
  // The server is implemented in Python
  const serverScript = path.join(context.extensionPath, 'server.py');

  // Check if server script exists
  if (!fs.existsSync(serverScript)) {
    window.showErrorMessage(`EasyCoder LSP server not found at ${serverScript}`);
    return;
  }

  // Debug options for Python server
  const isDev = context.extensionMode === ExtensionMode.Development;

  // Server options: run the Python server
  let serverOptions: ServerOptions = {
    run: {
      command: 'python3',
      args: [serverScript, workspaceRoot],
      transport: TransportKind.stdio
    },
    debug: {
      command: 'python3',
      args: [serverScript, workspaceRoot],
      transport: TransportKind.stdio,
      options: {
        env: {
          // Signal the Python server to open debugpy port
          EASYCODER_LSP_DEBUGPY: '1'
        }
      }
    }
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for EasyCoder documents
    documentSelector: [
      { scheme: 'file', language: 'easycoder' }
    ],
    synchronize: {
      // Notify the server about file changes to workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.ecs')
    },
    // Send workspace folder info to server
    workspaceFolder: workspace.workspaceFolders?.[0] || undefined
  };

  // Create the language client and start the client
  client = new LanguageClient(
    'easycoderLsp',
    'EasyCoder Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();

  // Register VS Code commands
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration('easycoder')) {
        // Restart server if configuration changes significantly
        await client.stop();
        client.start();
      }
    })
  );

  console.log('EasyCoder Language Server activated');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
