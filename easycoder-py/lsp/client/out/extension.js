"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    const workspaceRoot = vscode_1.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    // Start Python language server using python-languageserver bridge
    // The server is implemented in Python
    const serverScript = path.join(context.extensionPath, 'server.py');
    // Check if server script exists
    if (!fs.existsSync(serverScript)) {
        vscode_1.window.showErrorMessage(`EasyCoder LSP server not found at ${serverScript}`);
        return;
    }
    // Debug options for Python server
    const isDev = context.extensionMode === vscode_1.ExtensionMode.Development;
    // Server options: run the Python server
    let serverOptions = {
        run: {
            command: 'python3',
            args: [serverScript, workspaceRoot],
            transport: node_1.TransportKind.stdio
        },
        debug: {
            command: 'python3',
            args: [serverScript, workspaceRoot],
            transport: node_1.TransportKind.stdio,
            options: {
                env: {
                    // Signal the Python server to open debugpy port
                    EASYCODER_LSP_DEBUGPY: '1'
                }
            }
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for EasyCoder documents
        documentSelector: [
            { scheme: 'file', language: 'easycoder' }
        ],
        synchronize: {
            // Notify the server about file changes to workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.ecs')
        },
        // Send workspace folder info to server
        workspaceFolder: vscode_1.workspace.workspaceFolders?.[0] || undefined
    };
    // Create the language client and start the client
    client = new node_1.LanguageClient('easycoderLsp', 'EasyCoder Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    // Register VS Code commands
    context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration('easycoder')) {
            // Restart server if configuration changes significantly
            await client.stop();
            client.start();
        }
    }));
    console.log('EasyCoder Language Server activated');
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
