# JabRef 4 VSCode

JabRef 4 VSCode brings the support for using JabRef's features like integrity and consistency checks and more to your VSCode environment!

## Features

You can use JabRef's [integrity](https://docs.jabref.org/finding-sorting-and-cleaning-entries/checkintegrity) and [consistency](https://docs.jabref.org/finding-sorting-and-cleaning-entries/checkconsistency) checks right in your VSCode environment when working with `.bib` or `.bibtex` files.
Both options can be enabled or disabled separately in the VSCode extension settings.

## Installation

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=jabref.jabref-4-vscode) or from [Open VSX](https://open-vsx.org/extension/JabRef/jabref-4-vscode).

To try the latest development version, download the `.vsix` for your platform from the [nightly build](https://nightly.link/JabRef/lsp-vscode-extension/workflows/build/main?preview) and install it via "Extensions: Install from VSIX...".

## JabRef language server

The checks are provided by the JabRef language server.
The extension connects to it on `localhost:2087` (configurable via `jabref.client.host` and `jabref.client.port`).

- If JabRef 6.0-beta.1 or later is running, the extension uses the language server embedded in JabRef.
- Otherwise, the extension downloads the standalone language server (JabLS) from the [JabRef development builds](https://builds.jabref.org/main/) and starts it.
  No Java installation is required.

## How to test this extension

Clone this repository, run `npm install` and `npm run build`, and open the repository in VSCode.
Then use VSCode's "Run and Debug" to start a VSCode instance with the extension installed.
