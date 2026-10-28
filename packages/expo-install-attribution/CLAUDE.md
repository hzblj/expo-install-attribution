# @hzblj/expo-install-attribution

What the stores know about where an install came from: the JavaScript API (`src/` → `build/`) and the
`ExpoInstallAttribution` module (`ios/`, `android/`). No config plugin: Play's library merges its own permission into
the manifest, and the podspec links AdServices.

| Path | What it is |
| --- | --- |
| `src/installReferrer.ts` | `getInstallReferrer`: one shared request, a success kept for the process, a failure dropped. |
| `src/appleAds.ts` | `getAppleAdsAttributionToken` (native) and `getAppleAdsAttribution` (token + resolve). |
| `src/appleAdsApi.ts` | `resolveAppleAdsAttribution` and `parseAppleAdsAttribution`: Apple's attribution API over `fetch`, no React Native imports, so `test/` runs it in Node and a server can use it. |
| `src/errors.ts` | The codes, `AppleAdsAttributionError` and the guards. |
| `android/.../ExpoInstallAttributionModule.kt` | Play Install Referrer (`com.android.installreferrer:installreferrer:2.2`). |
| `ios/ExpoInstallAttributionModule.swift` | `AAAttribution.attributionToken()`. |

**One function per platform.** Android defines `getInstallReferrer`, iOS `getAppleAdsAttributionToken`; the module type
declares both optional, and the JavaScript answers `null` where the function or the module is missing.

**The codes exist twice.** Native rejections (`ERR_INSTALL_REFERRER_*` in Kotlin, `ERR_APPLE_ADS_TOKEN_*` in Swift) and
the lists in `src/errors.ts` must match, or a guard misses a code. `isPermanentInstallReferrerError` is the two Play
answers that never recover (`DEVELOPER_ERROR`, `PERMISSION_ERROR`).

**One answer per call on Android.** The setup callback, the disconnect callback and the timeout race through one
`AtomicBoolean`; the details are read off the main thread (a binder call) and the connection is always ended.
`FEATURE_NOT_SUPPORTED` resolves `null`, every other response code rejects.

**Apple's 404 is "not yet".** The API answers 404 until it has processed a token, so `resolveAppleAdsAttribution`
retries a 404 three times, 5 s apart, as Apple advises. A token is valid for 24 hours.

**Tests.** `yarn test` (node:test over `test/`: the Apple Ads client with a mocked `fetch` and timers, the guards). The
native side has no unit tests: the example on a simulator, an emulator with Google Play, or a device is the check.

Code style follows `@hzblj/biome-config`. Docs copy (README, JSDoc, changesets) has no em dashes.
