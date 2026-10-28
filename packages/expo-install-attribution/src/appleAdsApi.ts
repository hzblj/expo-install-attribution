import {AppleAdsAttributionError} from './errors'
import type {AppleAdsAttribution, ResolveAppleAdsAttributionOptions} from './types'

const APPLE_ADS_ATTRIBUTION_URL = 'https://api-adservices.apple.com/api/v1/'
const DEFAULT_TIMEOUT_MS = 10_000
const NOT_FOUND_RETRIES = 3
const NOT_FOUND_RETRY_DELAY_MS = 5_000

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const numberField = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key]

  return typeof value === 'number' ? value : null
}

const stringField = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key]

  return typeof value === 'string' ? value : null
}

/**
 * Apple's answer as an `AppleAdsAttribution`: `null` when the install didn't come from Apple Ads (`attribution: false`).
 * Throws `ERR_APPLE_ADS_UNEXPECTED_RESPONSE` without the `attribution` flag.
 */
export const parseAppleAdsAttribution = (payload: unknown): AppleAdsAttribution | null => {
  if (!isRecord(payload) || typeof payload.attribution !== 'boolean') {
    throw new AppleAdsAttributionError(
      'ERR_APPLE_ADS_UNEXPECTED_RESPONSE',
      'Apple Ads answered without the attribution flag'
    )
  }

  if (!payload.attribution) {
    return null
  }

  return {
    adGroupId: numberField(payload, 'adGroupId'),
    adId: numberField(payload, 'adId'),
    campaignId: numberField(payload, 'campaignId'),
    claimType: stringField(payload, 'claimType'),
    clickDate: stringField(payload, 'clickDate'),
    conversionType: stringField(payload, 'conversionType'),
    countryOrRegion: stringField(payload, 'countryOrRegion'),
    keywordId: numberField(payload, 'keywordId'),
    orgId: numberField(payload, 'orgId'),
    payload,
  }
}

const postToken = async (token: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(APPLE_ADS_ATTRIBUTION_URL, {
      body: token,
      headers: {'Content-Type': 'text/plain'},
      method: 'POST',
      signal: controller.signal,
    })
  } catch {
    throw controller.signal.aborted
      ? new AppleAdsAttributionError('ERR_APPLE_ADS_TIMEOUT', `Apple Ads did not answer within ${timeoutMs} ms`)
      : new AppleAdsAttributionError('ERR_APPLE_ADS_NETWORK', 'Apple Ads could not be reached')
  } finally {
    clearTimeout(timeout)
  }
}

const requestAttribution = async (token: string, timeoutMs: number, retriesLeft: number): Promise<Response> => {
  const response = await postToken(token, timeoutMs)

  if (response.status !== 404 || retriesLeft === 0) {
    return response
  }

  await wait(NOT_FOUND_RETRY_DELAY_MS)

  return requestAttribution(token, timeoutMs, retriesLeft - 1)
}

const toResponseError = (status: number) => {
  if (status === 400) {
    return new AppleAdsAttributionError('ERR_APPLE_ADS_INVALID_TOKEN', 'Apple Ads rejected the attribution token')
  }

  if (status === 404) {
    return new AppleAdsAttributionError(
      'ERR_APPLE_ADS_NOT_FOUND',
      'Apple Ads has no record for the attribution token yet'
    )
  }

  if (status >= 500) {
    return new AppleAdsAttributionError('ERR_APPLE_ADS_UNAVAILABLE', `Apple Ads is unavailable (HTTP ${status})`)
  }

  return new AppleAdsAttributionError('ERR_APPLE_ADS_UNEXPECTED_RESPONSE', `Apple Ads answered with HTTP ${status}`)
}

/**
 * Posts an AdServices token to Apple's attribution API and answers the campaign, or `null` when the install didn't come
 * from Apple Ads. Runs anywhere `fetch` does, so a token can also be resolved on your server. Apple answers 404 until it
 * has processed the token: a 404 is retried three times, 5 s apart, as Apple advises.
 */
export const resolveAppleAdsAttribution = async (
  token: string,
  options: ResolveAppleAdsAttributionOptions = {}
): Promise<AppleAdsAttribution | null> => {
  const response = await requestAttribution(token, options.timeoutMs ?? DEFAULT_TIMEOUT_MS, NOT_FOUND_RETRIES)

  if (!response.ok) {
    throw toResponseError(response.status)
  }

  return parseAppleAdsAttribution(await response.json())
}
