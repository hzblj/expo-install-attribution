import assert from 'node:assert/strict'
import {test} from 'node:test'

import {
  AppleAdsAttributionError,
  isAppleAdsError,
  isInstallReferrerError,
  isPermanentInstallReferrerError,
} from '../src/errors'

/** What the native module rejects with: an Error carrying its code. */
const coded = (code: string) => Object.assign(new Error(code), {code})

test('tells the Install Referrer codes apart', () => {
  assert.equal(isInstallReferrerError(coded('ERR_INSTALL_REFERRER_TIMEOUT')), true)
  assert.equal(isInstallReferrerError(coded('ERR_INSTALL_REFERRER_PERMISSION_ERROR')), true)
  assert.equal(isInstallReferrerError(coded('ERR_APPLE_ADS_TOKEN_NETWORK')), false)
})

test('only a developer or permission error is permanent', () => {
  assert.equal(isPermanentInstallReferrerError(coded('ERR_INSTALL_REFERRER_DEVELOPER_ERROR')), true)
  assert.equal(isPermanentInstallReferrerError(coded('ERR_INSTALL_REFERRER_PERMISSION_ERROR')), true)

  for (const code of [
    'ERR_INSTALL_REFERRER_SERVICE_UNAVAILABLE',
    'ERR_INSTALL_REFERRER_SERVICE_DISCONNECTED',
    'ERR_INSTALL_REFERRER_TIMEOUT',
    'ERR_INSTALL_REFERRER_READ_FAILED',
    'ERR_INSTALL_REFERRER_UNKNOWN_RESPONSE',
  ]) {
    assert.equal(isPermanentInstallReferrerError(coded(code)), false, code)
  }
})

test('the Apple Ads guard knows the native and the JavaScript codes', () => {
  assert.equal(isAppleAdsError(coded('ERR_APPLE_ADS_TOKEN_FAILED')), true)
  assert.equal(isAppleAdsError(new AppleAdsAttributionError('ERR_APPLE_ADS_TIMEOUT', 'timeout')), true)
  assert.equal(isAppleAdsError(coded('ERR_INSTALL_REFERRER_TIMEOUT')), false)
})

test('nothing without a known code passes', () => {
  for (const value of [null, undefined, 'ERR_APPLE_ADS_TIMEOUT', {code: 'ERR_APPLE_ADS_TIMEOUT'}, new Error('x')]) {
    assert.equal(isAppleAdsError(value), false)
    assert.equal(isInstallReferrerError(value), false)
  }
})
