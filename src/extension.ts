import {
    ExtensionContext,
    workspace
} from 'vscode';

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

    context.subscriptions.push({
        dispose: async () => {
            await client?.stop();
            await manager?.stopServerProcess();
            console.log('[JabLS] Client stopped (dispose)');
        }
    });
}

export async function deactivate(): Promise<void> {
    await client?.stop();
    await manager?.stopServerProcess();
    console.log('[JabLS] Client stopped (deactivate)');
}
