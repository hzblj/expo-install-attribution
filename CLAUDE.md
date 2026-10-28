# expo-install-attribution

Turborepo + Yarn 4 workspaces for **`@hzblj/expo-install-attribution`**: where an install came from, for Expo. The Play
Install Referrer on Android, Apple Ads attribution through AdServices on iOS. React Native and Expo only; on the web
every function answers `null`.

Every package has its own `CLAUDE.md`: read that one before touching it.

| Path | Package | What lives there |
| --- | --- | --- |
| `packages/expo-install-attribution/` | `@hzblj/expo-install-attribution` | The JavaScript API (`src/`), the `ExpoInstallAttribution` module (`ios/`, `android/`) and the tests of the Apple Ads API client and the error guards. |
| `apps/example/` | `expo-install-attribution-example` (private) | Expo Router app built with `@hzblj/kara-ui`: one screen with what both stores answer for this install, live. Runs the package from **source**. |
| `scripts/` | | `pack-check.mjs`: the tarball as npm gets it, and a consumer type-checked against it. |
| `.changeset/`, `.github/workflows/` | | Release notes (`yarn changeset`), CI (Biome, typecheck, tests, pack check, the Android module compiled) and the changesets → npm release. |

## Commands

```bash
yarn ios / yarn android      # run the example (dev client)
yarn prebuild                # a clean `expo prebuild` of the example, after native or config changes
yarn test                    # the Apple Ads client and the error guards (node:test)
yarn typecheck / yarn lint   # tsc, Biome
yarn pack:check              # what npm receives, and a consumer type-check
yarn changeset               # describe a change for the next release
```

## Conventions that bite

**The example runs the package's source; the world runs `build/`.** The package's `exports` names a `source` entry,
which the example's `metro.config.js` maps and its `tsconfig.json` mirrors with `paths`, so nothing waits for a build.
Not a global `source` condition: published packages ship one too, and kara-ui's points at platform-split sources.

**Real answers need a store install.** A build from Xcode or Gradle isn't one: Play answers it
`utm_source=google-play&utm_medium=organic` with every timestamp `0`, and the iOS simulator has no AdServices (the token
is `null`). The README's screenshots run the example on samples: `?sample=1` (Android:
`adb shell am start -d "install-attribution-example:///?sample=1"`) or the `sample` default on iOS
(`xcrun simctl spawn <udid> defaults write com.hzblj.expoinstallattribution.example sample -string 1`, delete it after).

**Publish through Yarn, tag through changesets.** `yarn release` runs `yarn npm publish` in every public workspace and
then `changeset tag`. Never `changeset publish`: its npm call would ship `workspace:` ranges verbatim.

**Docs copy has no em dashes.** Not in the READMEs, the JSDoc in `src/` (it is the API reference), changesets or the
example. Rewrite with a comma, a colon, parentheses or a second sentence. Code comments are exempt.

**Commits are Jan's alone.** Author `Jan Blazej <hello@janblazej.dev>` (set locally in this repo), no co-author or
generated-by lines.

Code style is Biome-enforced (`@hzblj/biome-config`): 2 spaces, 120 cols, single quotes, no semicolons, sorted imports
and object keys. Named exports and `const` arrow functions; `type` over `interface`.
