import type {AppleAdsAttribution, InstallReferrer} from '@hzblj/expo-install-attribution'

/**
 * What a store install from a campaign answers, for the README's screenshots (`?sample=1`). A build from Xcode or
 * Gradle isn't a store install: Play answers it the organic referrer, and the iOS simulator has no AdServices.
 */
export const SAMPLE_REFERRER: InstallReferrer = {
  googlePlayInstant: false,
  installBeginTimestampSeconds: 1_793_122_971,
  installBeginTimestampServerSeconds: 1_793_122_969,
  installReferrer: 'utm_source=newsletter&utm_campaign=autumn',
  installVersion: '1.0.0',
  referrerClickTimestampSeconds: 1_793_122_930,
  referrerClickTimestampServerSeconds: 1_793_122_928,
}

export const SAMPLE_TOKEN = 'AAAAIgAAAAMfJ4kZt0e+1oqnVxCe3w0gW2oPDsQ2AxBrQ4NDJy9lLwAAAAAAAAAA'

const CAMPAIGN = {
  adGroupId: 1_548_321_077,
  adId: 1_548_327_410,
  attribution: true,
  campaignId: 1_548_320_116,
  claimType: 'Click',
  clickDate: '2026-10-27T17:42Z',
  conversionType: 'Download',
  countryOrRegion: 'CZ',
  keywordId: 1_548_336_902,
  orgId: 4_066_982,
}

export const SAMPLE_CAMPAIGN: AppleAdsAttribution = {...CAMPAIGN, payload: CAMPAIGN}
