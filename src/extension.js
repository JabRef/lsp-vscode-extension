const vscode = require('vscode');

const { LanguageClient, TransportKind } = require('vscode-languageclient/node');

function activate(context) {
  const serverOptions = () => new Promise((resolve) => {
    const socket = require('net').connect({ port: 2087 });
    resolve({ reader: socket, writer: socket });
  });

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'bibtex' }],
    synchronize: { configurationSection: 'jabref' }
  };

  const client = new LanguageClient(
    'bibtexLsp',
    'JabRef LSP Client',
    serverOptions,
    clientOptions
  );

  client.setTrace('verbose');
  context.subscriptions.push(client.start());
}

function deactivate() {}

module.exports = { activate, deactivate };
