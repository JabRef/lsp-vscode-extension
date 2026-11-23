# Changelog

All notable changes to the "jabref-4-vscode" extension will be documented in this file.

## [Unreleased]

### Added

- Hover shows a DOI, arXiv ID or ISBN as full citation in the preview style selected in JabRef (needs a JabLS build with this feature).
- Code action to fetch the entry for a DOI, arXiv ID or ISBN under the cursor and add it to an open `.bib` file (needs a JabLS build with this feature).
- Code action to replace a DOI, arXiv ID or ISBN in a Markdown file by its citation (needs a JabLS build with this feature).

## [0.2.1] - 2026-10-12

### Fixed

- Code Spell Checker no longer flags BibTeX syntax such as field names (`issn`, `journaltitle`), entry types and citation keys in `.bib` files.
- The language server is now notified when `.bib`, `.bibtex` and `.md` files change on disk.

## [0.2.0] - 2026-09-27

### Added

- The extension starts the JabRef language server (JabLS) automatically if none is running.
- Checks now also run on Markdown and LaTeX files.
- More consistency check options (required, optional, and unknown fields).
- Keybinding to call the "cite as you write" (CAYW) endpoint.
- Status messages in the UI.
- Links to the documentation of JabRef's integrity and consistency checks.

### Fixed

- JabLS is downloaded from its new location.

## [0.1.1] - 2025-09-14

### Fixed

- Release workflow fixed

## [0.1.0] - 2025-09-14

### Added

- Initial connection to JabRef

[Unreleased]: https://github.com/JabRef/lsp-vscode-extension/compare/0.2.1...HEAD
[0.2.1]: https://github.com/JabRef/lsp-vscode-extension/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/JabRef/lsp-vscode-extension/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/JabRef/lsp-vscode-extension/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/JabRef/lsp-vscode-extension/releases/tag/0.1.0
