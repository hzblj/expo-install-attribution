import {NativeModule, requireOptionalNativeModule} from 'expo'

import type {InstallReferrer} from './types'

// Optional members: each platform defines only its own store's function, and a JS bundle newer than the native build it
// runs on (an OTA update) finds a function missing instead of crashing.
declare class ExpoInstallAttributionNativeModule extends NativeModule {
  getInstallReferrer?(timeoutMs: number): Promise<InstallReferrer | null>
  getAppleAdsAttributionToken?(): Promise<string | null>
}

export const ExpoInstallAttribution =
  requireOptionalNativeModule<ExpoInstallAttributionNativeModule>('ExpoInstallAttribution')
