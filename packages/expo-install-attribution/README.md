# @hzblj/expo-install-attribution

[![npm](https://img.shields.io/npm/v/@hzblj/expo-install-attribution.svg)](https://www.npmjs.com/package/@hzblj/expo-install-attribution)
[![license](https://img.shields.io/npm/l/@hzblj/expo-install-attribution.svg)](https://github.com/hzblj/expo-install-attribution/blob/main/LICENSE)

Where an install came from, for Expo: the Play Install Referrer on Android and Apple Ads attribution through AdServices on iOS, as promises with coded errors.

<p>
  <img alt="The example on iOS: the Apple Ads campaign of this install" height="560" src="https://raw.githubusercontent.com/hzblj/expo-install-attribution/main/media/ios-attribution.png" />
  <img alt="The example on Android: the Play Install Referrer of this install" height="560" src="https://raw.githubusercontent.com/hzblj/expo-install-attribution/main/media/android-attribution.png" />
</p>

## Install

```sh
npx expo install @hzblj/expo-install-attribution
```

Requires Expo SDK 57 or newer and a [development build](https://docs.expo.dev/develop/development-builds/introduction/). No config plugin: Play's library brings its permission, and the pod links AdServices.

## Quick start

```ts
import {getAppleAdsAttribution, getInstallReferrer} from '@hzblj/expo-install-attribution'

// Android: the `referrer` of the Play Store link, e.g. utm_source=newsletter&utm_campaign=autumn
const referrer = await getInstallReferrer()

// iOS: the Apple Ads campaign, or null when the install didn't come from Apple Ads
const campaign = await getAppleAdsAttribution()
```

Ask on the first launch and keep the answer: Play keeps the referrer for 90 days, an AdServices token is valid for 24 hours.

## API

| Function | Platform | Resolves with |
| --- | --- | --- |
| `getInstallReferrer({timeoutMs?})` | Android | `InstallReferrer`, or `null` on iOS, the web, Expo Go and where Play doesn't support the API |
| `getAppleAdsAttributionToken()` | iOS | The AdServices token, or `null` on Android, the web, Expo Go and where AdServices isn't supported |
| `resolveAppleAdsAttribution(token, {timeoutMs?})` | Anywhere with `fetch` | `AppleAdsAttribution`, or `null` when the install didn't come from Apple Ads |
| `getAppleAdsAttribution({timeoutMs?})` | iOS | The two above in one |
| `parseAppleAdsAttribution(payload)` | Anywhere | Apple's answer fetched elsewhere, e.g. on your server, as `AppleAdsAttribution` |
| `isInstallReferrerError`, `isPermanentInstallReferrerError`, `isAppleAdsError` | Anywhere | Type guards for the errors below |

`timeoutMs` defaults to `10000`. Concurrent `getInstallReferrer` calls share one request, and a success is kept for the life of the process. `resolveAppleAdsAttribution` retries Apple's 404 (the token isn't processed yet) three times, 5 s apart, as Apple advises.

### `InstallReferrer`

| Field | Type | Meaning |
| --- | --- | --- |
| `installReferrer` | `string` | The `referrer` parameter of the Play Store link |
| `referrerClickTimestampSeconds` | `number` | When the link was clicked, by the device's clock, `0` when unknown |
| `installBeginTimestampSeconds` | `number` | When the install began, by the device's clock |
| `referrerClickTimestampServerSeconds` | `number` | When the link was clicked, by Google's clock |
| `installBeginTimestampServerSeconds` | `number` | When the install began, by Google's clock |
| `installVersion` | `string \| null` | The app version first installed |
| `googlePlayInstant` | `boolean` | Whether the app's Instant experience was launched in the past 7 days |

### `AppleAdsAttribution`

`orgId`, `campaignId`, `adGroupId`, `keywordId`, `adId` (`number | null`), `conversionType` (`Download` or `Redownload`), `claimType` (`Click` or `Impression`), `countryOrRegion`, `clickDate` (only when the user allowed tracking) as `string | null`, and `payload`, Apple's whole answer.

## Errors

Every rejection is an `Error` with a `code`.

| Code | When | Retry? |
| --- | --- | --- |
| `ERR_INSTALL_REFERRER_SERVICE_UNAVAILABLE` | Play's service can't be reached | Yes |
| `ERR_INSTALL_REFERRER_SERVICE_DISCONNECTED` | Play disconnected before it answered | Yes |
| `ERR_INSTALL_REFERRER_TIMEOUT` | No answer within `timeoutMs` | Yes |
| `ERR_INSTALL_REFERRER_READ_FAILED` | Connected, but the details couldn't be read | Yes |
| `ERR_INSTALL_REFERRER_UNKNOWN_RESPONSE` | A response code this version doesn't know | Yes |
| `ERR_INSTALL_REFERRER_DEVELOPER_ERROR` | Play rejected the request | No (`isPermanentInstallReferrerError`) |
| `ERR_INSTALL_REFERRER_PERMISSION_ERROR` | The app may not bind to Play's service | No (`isPermanentInstallReferrerError`) |
| `ERR_APPLE_ADS_TOKEN_NETWORK` | AdServices needs a network connection for the token | Yes |
| `ERR_APPLE_ADS_TOKEN_FAILED` | AdServices failed to create the token | Yes |
| `ERR_APPLE_ADS_NETWORK` | Apple's API couldn't be reached | Yes |
| `ERR_APPLE_ADS_TIMEOUT` | Apple's API didn't answer within `timeoutMs` | Yes |
| `ERR_APPLE_ADS_NOT_FOUND` | Apple still had no record after the retries | Yes, later |
| `ERR_APPLE_ADS_UNAVAILABLE` | Apple's API answered 5xx | Yes |
| `ERR_APPLE_ADS_INVALID_TOKEN` | Apple rejected the token (400) | With a new token |
| `ERR_APPLE_ADS_UNEXPECTED_RESPONSE` | Any other status, or an answer without `attribution` | No |

## Not supported

- A click on your website on iOS: Apple has no install referrer, and AdServices knows only Apple Ads. Match web clicks on your server.
- Stores other than Google Play and the App Store.
- SKAdNetwork and AdAttributionKit postbacks, and the App Tracking Transparency prompt.

## Testing

- Play answers a build that wasn't installed from Google Play with `utm_source=google-play&utm_medium=organic` and every timestamp `0`. A campaign link needs an install from Google Play, e.g. from a testing track.
- The iOS simulator has no AdServices: `getAppleAdsAttributionToken()` resolves `null` there. Use a device.

## More libraries

The other libraries from the same author are at **[libraries.janblazej.dev](https://www.libraries.janblazej.dev)**.

## License

MIT © Jan Blazej
