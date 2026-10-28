import {Platform} from 'react-native'

import {resolveAppleAdsAttribution} from './appleAdsApi'
import {ExpoInstallAttribution} from './ExpoInstallAttributionModule'
import type {AppleAdsAttribution, ResolveAppleAdsAttributionOptions} from './types'

/**
 * iOS: the AdServices attribution token, valid for 24 hours. `null` on Android, on the web, without the native module
 * (Expo Go) and where AdServices isn't supported. Rejects with `ERR_APPLE_ADS_TOKEN_NETWORK` or
 * `ERR_APPLE_ADS_TOKEN_FAILED`.
 */
export const getAppleAdsAttributionToken = async (): Promise<string | null> => {
  const native = ExpoInstallAttribution

  if (Platform.OS !== 'ios' || !native?.getAppleAdsAttributionToken) {
    return null
  }

  return native.getAppleAdsAttributionToken()
}

/** `getAppleAdsAttributionToken` and `resolveAppleAdsAttribution` in one: the campaign, or `null`. */
export const getAppleAdsAttribution = async (
  options: ResolveAppleAdsAttributionOptions = {}
): Promise<AppleAdsAttribution | null> => {
  const token = await getAppleAdsAttributionToken()

  if (!token) {
    return null
  }

  return resolveAppleAdsAttribution(token, options)
}
