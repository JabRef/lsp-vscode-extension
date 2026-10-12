# Changelog

All notable changes to the "jabref-4-vscode" extension will be documented in this file.

## [Unreleased]

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

[Unreleased]: https://github.com/JabRef/lsp-vscode-extension/compare/0.2.0...HEAD
[0.2.0]: https://github.com/JabRef/lsp-vscode-extension/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/JabRef/lsp-vscode-extension/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/JabRef/lsp-vscode-extension/releases/tag/0.1.0
