# JabRef 4 VSCode

JabRef 4 VSCode brings the support for using JabRef's features like integrity and consistency checks and more to your VSCode environment!

## Features

You can use JabRef's [integrity](https://docs.jabref.org/finding-sorting-and-cleaning-entries/checkintegrity) and [consistency](https://docs.jabref.org/finding-sorting-and-cleaning-entries/checkconsistency) checks right in your VSCode environment when working with `.bib` or `.bibtex` files.
Both options can be enabled or disabled separately in the VSCode extension settings.

Hovering over a DOI, arXiv ID or ISBN shows it as full citation, in the preview style selected in JabRef (if that is the customized style, the first CSL or BST style of JabRef's preview cycle).
To add a reference, put the cursor on a DOI, arXiv ID or ISBN (also as a link, e.g. `https://arxiv.org/abs/2608.10906`) in a Markdown, LaTeX or `.bib` file and open the quick fix menu (`Ctrl+.`).
"Add entry for … to refs.bib" fetches the entry and appends it to that `.bib` file; the file has to be open in an editor.

## JabRef language server

The checks are provided by the JabRef language server.
The extension connects to it on `localhost:2087` (configurable via `jabref.client.host` and `jabref.client.port`).

- If JabRef 6.0-beta.1 or later is running, the extension uses the language server embedded in JabRef.
- Otherwise, the extension downloads the standalone language server (JabLS) from the [JabRef development builds](https://builds.jabref.org/main/) and starts it.
  No Java installation is required.

## Installation

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=jabref.jabref-4-vscode) or from [Open VSX](https://open-vsx.org/extension/JabRef/jabref-4-vscode).

To try the latest development version, download the `.vsix` for your platform from the [nightly build](https://nightly.link/JabRef/lsp-vscode-extension/workflows/build/main?preview) and install it via "Extensions: Install from VSIX...".

## Run locally from source

1. `git clone https://github.com/JabRef/lsp-vscode-extension.git`
2. `cd lsp-vscode-extension`
3. `npm install`
4. Open the folder in VSCode.
5. Press `F5` (launch configuration "Run Extension").
   This builds the extension and opens a second VSCode window with the extension loaded.
6. In that window, open a `.bib` file to see the checks.
