# Developing hints

## Versioning the plugin

We release on each push on `main`.
Since VSCode marked place kind of demands to have the next version number in the pre-release, the version number in `package.json` is always the next version number (without SemVer suffix).

## Releasing a new version

1. Update `version` in `package.json`.
2. `npx release-it --no-increment`

Pushing the tag triggers CI, which creates the GitHub release and publishes to the Visual Studio Marketplace and Open VSX.

## Notes on versioning

VSCode requires to decide [either pre-release or release](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) for a certain version.
For versions 0.x.y, we always do full releases, because a) users can just install them and b) 0.x.y indicates that these are development versions, where breaking changes can occur.
