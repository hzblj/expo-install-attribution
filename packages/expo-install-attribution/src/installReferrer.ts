import {Platform} from 'react-native'

import {ExpoInstallAttribution} from './ExpoInstallAttributionModule'
import type {GetInstallReferrerOptions, InstallReferrer} from './types'

const DEFAULT_TIMEOUT_MS = 10_000

let request: Promise<InstallReferrer | null> | null = null

/**
 * Android: what Google Play knows about where the install came from. `null` on iOS, on the web, without the native
 * module (Expo Go) and where Play doesn't support the API (`FEATURE_NOT_SUPPORTED`). Any other failure rejects with an
 * `ERR_INSTALL_REFERRER_*` code.
 *
 * Calls share one request: concurrent calls get the same promise, a success is kept for the life of the process (the
 * referrer doesn't change), a failure is dropped so the next call asks Play again.
 */
export const getInstallReferrer = (options: GetInstallReferrerOptions = {}): Promise<InstallReferrer | null> => {
  const native = ExpoInstallAttribution

  if (Platform.OS !== 'android' || !native?.getInstallReferrer) {
    return Promise.resolve(null)
  }

  if (request) {
    return request
  }

  request = native.getInstallReferrer(options.timeoutMs ?? DEFAULT_TIMEOUT_MS).catch(error => {
    request = null
    throw error
  })

  return request
}
