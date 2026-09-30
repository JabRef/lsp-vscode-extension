---
status: accepted
date: 2026-09-27
---

# Use Biome for linting TypeScript

## Context and Problem Statement

The extension was linted with ESLint and typescript-eslint.
typescript-eslint relies on the JavaScript API of the TypeScript compiler and only supports `typescript <6.1.0`.
TypeScript 7 is the native (Go) rewrite of the compiler, so the Dependabot update to TypeScript 7 failed with a peer dependency conflict ([#275](https://github.com/JabRef/lsp-vscode-extension/pull/275)).
Which linter lets us keep our lint rules and move to TypeScript 7?

## Decision Drivers

* Update to TypeScript 7 without waiting for typescript-eslint
* Keep the existing rules (`curly`, `eqeqeq`, `no-throw-literal`, no star imports, import naming convention)
* Few dependencies and little configuration

## Considered Options

* Biome
* oxlint
* ESLint with typescript-eslint

## Decision Outcome

Chosen option: "Biome", because it does not depend on the TypeScript compiler and has a built-in equivalent for each of our ESLint rules.

### Consequences

* Good, because TypeScript 7 can be used.
* Good, because one dev dependency (`@biomejs/biome`) replaces three (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`).
* Good, because the Biome formatter replaces Prettier and covers the ESLint `semi` rule, which has no linter equivalent in Biome.
* Good, because Biome's recommended rule set extends the few rules we had.

### Confirmation

The `lint` job in `.github/workflows/build.yml` runs `npm run lint` (`biome check src`: lint and formatting) and `npm run compile`.

## Pros and Cons of the Options

### Biome

* Good, because it covers all existing rules: `useBlockStatements`, `noDoubleEquals`, `useThrowOnlyError`, `noNamespaceImport`, `useNamingConvention`
* Good, because linter and formatter are one tool with one configuration file (`biome.json`)
* Neutral, because rule names differ from ESLint

### oxlint

* Good, because it is very fast and keeps ESLint rule names
* Bad, because the import naming convention rule is not available
* Bad, because star imports need to be configured via `no-restricted-imports` patterns
* Bad, because formatting is out of scope, so `semi` needs another tool

### ESLint with typescript-eslint

* Good, because no migration is needed
* Bad, because TypeScript 7 is blocked until typescript-eslint supports it
