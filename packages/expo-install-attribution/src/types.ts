/** What Google Play knows about the install: its `ReferrerDetails`, field by field. */
export type InstallReferrer = {
  /** The `referrer` parameter of the Play Store link that led to the install, e.g. `utm_source=web&utm_campaign=sale`. */
  installReferrer: string
  /** When the Play Store link was clicked, in seconds since the epoch, by the device's clock. `0` when unknown. */
  referrerClickTimestampSeconds: number
  /** When the install began, in seconds since the epoch, by the device's clock. `0` when unknown. */
  installBeginTimestampSeconds: number
  /** When the Play Store link was clicked, by Google's server clock. `0` when unknown. */
  referrerClickTimestampServerSeconds: number
  /** When the install began, by Google's server clock. `0` when unknown. */
  installBeginTimestampServerSeconds: number
  /** The app version first installed, or `null`. */
  installVersion: string | null
  /** Whether the app's Google Play Instant experience was launched in the past 7 days. */
  googlePlayInstant: boolean
}

export type GetInstallReferrerOptions = {
  /** How long to wait for Play to answer, in ms. Default `10000`. */
  timeoutMs?: number
}

/** The Apple Ads campaign an install came from, as Apple's attribution API answers it. */
export type AppleAdsAttribution = {
  orgId: number | null
  campaignId: number | null
  adGroupId: number | null
  keywordId: number | null
  adId: number | null
  /** `Download` or `Redownload`. */
  conversionType: string | null
  /** `Click` or `Impression`. */
  claimType: string | null
  /** The App Store storefront, e.g. `US`. */
  countryOrRegion: string | null
  /** Only when the user allowed tracking (App Tracking Transparency). */
  clickDate: string | null
  /** Apple's whole answer, for the fields not listed here. */
  payload: Readonly<Record<string, unknown>>
}

export type ResolveAppleAdsAttributionOptions = {
  /** How long to wait for each request to Apple, in ms. Default `10000`. */
  timeoutMs?: number
}
