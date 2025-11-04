import {
    ExtensionContext,
    workspace
} from 'vscode';

import vscode from 'vscode';

import {
    CloseAction,
    ErrorAction,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    Trace,
} from 'vscode-languageclient/node';
import { ServerManager, ServerArchiveInfo } from './ServerManager';
import path from 'path';



let client: LanguageClient | undefined;
let manager: ServerManager | undefined;

export function activate(context: ExtensionContext) {

    const serverInfos: ServerArchiveInfo[] = [
        {
            platform: 'windows',
            url: 'https://builds.jabref.org/main/jabls-portable_windows.zip',
            workingDir: 'jabls',
            bin: 'jabls.exe',
            archiveType: 'zip'
        },
        {
            platform: 'macos',
            url: 'https://builds.jabref.org/main/jabls-portable_macos.zip',
            workingDir: path.join('jabls.app', 'Contents', 'MacOS'),
            bin: 'jabls',
            archiveType: 'zip'
        },
        {
            platform: 'macos-arm',
            url: 'https://builds.jabref.org/main/jabls-portable_macos-arm.zip',
            workingDir: path.join('jabls.app', 'Contents', 'MacOS'),
            bin: 'jabls',
            archiveType: 'zip'
        },
        {
            platform: 'linux',
            url: 'https://builds.jabref.org/main/jabls-portable_linux.tar.gz',
            workingDir: path.join('jabls', 'bin'),
            bin: 'jabls',
            archiveType: 'tar.gz'
        },
        {
            platform: 'linux-arm64',
            url: 'https://builds.jabref.org/main/jabls-portable_linux_arm64.tar.gz',
            workingDir: path.join('jabls', 'bin'),
            bin: 'jabls',
            archiveType: 'tar.gz'
        }
    ];

    manager = new ServerManager(serverInfos);

    const serverOptions: ServerOptions = () => manager!.ensureServerConnection();

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{
            scheme: 'file',
            language: 'bibtex'
        }, {
            scheme: 'file',
            language: 'markdown'
        }, {
            scheme: 'untitled',
            language: 'markdown'
        }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.*{bib,bibtex,md}'),
            configurationSection: 'jabref'
        },
        errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.Restart }),
        },
        initializationFailedHandler: () => true,
    };
    client = new LanguageClient(
        'jabref-4-vscode',
        'JabRef LSP Client',
        serverOptions,
        clientOptions
    );


    client.setTrace(Trace.Verbose);
    client.start();

    context.subscriptions.push(vscode.commands.registerCommand('extension.callCaywHttpEndpoint', callCaywHttpEndpoint));

    context.subscriptions.push({
        dispose: async () => {
            await client?.stop();
            await manager?.stopServerProcess();
            console.log('[JabLS] Client stopped (dispose)');
        },
    });
}

export async function deactivate(): Promise<void> {
    await client?.stop();
    await manager?.stopServerProcess();
    console.log('[JabLS] Client stopped (deactivate)');
}

async function callCaywHttpEndpoint(): Promise<void> {
    const endpoint: URL | null = URL.parse(vscode.workspace.getConfiguration('jabref').get<string>('cayw.endpoint', 'http://localhost:23119/cayw'));
    if (!endpoint) {
        vscode.window.showErrorMessage('CAYW: invalid URL for CAYW endpoint');
        return;
    }
    const result: Response = await fetch(endpoint);
    if (result.ok) {
        const text = await result.text();
        insertCaywResult(text);
    } else {
        console.log(`CAYW: received HTTP ${result.status} from CAYW endpoint`);
        vscode.window.showErrorMessage(`CAYW: received HTTP ${result.status} from endpoint. Make sure it is running.`);
    }
    try {
    } catch (err: any) {
        console.log('Failed to fetch cayw endpoint: %j', err);
        vscode.window.showErrorMessage('Could not connect to CAYW endpoint. Make sure it is running.');
    }
}

function insertCaywResult(result: string): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.edit(editBuilder => {
            editor.selections.forEach(selection => {
                editBuilder.delete(selection);
                editBuilder.insert(selection.start, result);
            });
        });
    }
}
