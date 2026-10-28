const INSTALL_REFERRER_TRANSIENT_CODES = [
  'ERR_INSTALL_REFERRER_SERVICE_UNAVAILABLE',
  'ERR_INSTALL_REFERRER_SERVICE_DISCONNECTED',
  'ERR_INSTALL_REFERRER_TIMEOUT',
  'ERR_INSTALL_REFERRER_READ_FAILED',
  'ERR_INSTALL_REFERRER_UNKNOWN_RESPONSE',
] as const

const INSTALL_REFERRER_PERMANENT_CODES = [
  'ERR_INSTALL_REFERRER_DEVELOPER_ERROR',
  'ERR_INSTALL_REFERRER_PERMISSION_ERROR',
] as const

const APPLE_ADS_CODES = [
  'ERR_APPLE_ADS_TOKEN_NETWORK',
  'ERR_APPLE_ADS_TOKEN_FAILED',
  'ERR_APPLE_ADS_NETWORK',
  'ERR_APPLE_ADS_TIMEOUT',
  'ERR_APPLE_ADS_INVALID_TOKEN',
  'ERR_APPLE_ADS_NOT_FOUND',
  'ERR_APPLE_ADS_UNAVAILABLE',
  'ERR_APPLE_ADS_UNEXPECTED_RESPONSE',
] as const

export type InstallReferrerErrorCode =
  | (typeof INSTALL_REFERRER_TRANSIENT_CODES)[number]
  | (typeof INSTALL_REFERRER_PERMANENT_CODES)[number]

export type AppleAdsErrorCode = (typeof APPLE_ADS_CODES)[number]

export type InstallReferrerError = Error & {code: InstallReferrerErrorCode}

export type AppleAdsError = Error & {code: AppleAdsErrorCode}

/**
 * What `resolveAppleAdsAttribution` rejects with. The token's own failures come from the native module, coded the same
 * way.
 */
export class AppleAdsAttributionError extends Error {
  readonly code: AppleAdsErrorCode

  constructor(code: AppleAdsErrorCode, message: string) {
    super(message)
    this.name = 'AppleAdsAttributionError'
    this.code = code
  }
}

const hasCode = (error: unknown): error is Error & {code: string} =>
  error instanceof Error && 'code' in error && typeof error.code === 'string'

const isOneOf = (codes: readonly string[], code: string) => codes.some(known => known === code)

/** Whether `error` is one of `getInstallReferrer`'s rejections. */
export const isInstallReferrerError = (error: unknown): error is InstallReferrerError =>
  hasCode(error) &&
  (isOneOf(INSTALL_REFERRER_TRANSIENT_CODES, error.code) || isOneOf(INSTALL_REFERRER_PERMANENT_CODES, error.code))

/**
 * Whether asking Play again can't help: `ERR_INSTALL_REFERRER_DEVELOPER_ERROR` or `ERR_INSTALL_REFERRER_PERMISSION_ERROR`.
 * Every other code is worth a retry, on a later launch at the latest.
 */
export const isPermanentInstallReferrerError = (error: unknown): error is InstallReferrerError =>
  hasCode(error) && isOneOf(INSTALL_REFERRER_PERMANENT_CODES, error.code)

/** Whether `error` is one of the Apple Ads functions' rejections. */
export const isAppleAdsError = (error: unknown): error is AppleAdsError =>
  hasCode(error) && isOneOf(APPLE_ADS_CODES, error.code)
