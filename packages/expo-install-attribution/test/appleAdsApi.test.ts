import assert from 'node:assert/strict'
import {afterEach, mock, test} from 'node:test'

import {parseAppleAdsAttribution, resolveAppleAdsAttribution} from '../src/appleAdsApi'
import {isAppleAdsError} from '../src/errors'

// Apple's sample answer for an install from an Apple Ads click.
const CAMPAIGN = {
  adGroupId: 1234567890,
  adId: 1234567890,
  attribution: true,
  campaignId: 1234567890,
  claimType: 'Click',
  clickDate: '2026-04-08T17:17Z',
  conversionType: 'Download',
  countryOrRegion: 'US',
  keywordId: 12323222,
  orgId: 1234567890,
}

const respond = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), {status})

const rejectsWith = async (promise: Promise<unknown>, code: string) => {
  await assert.rejects(promise, error => isAppleAdsError(error) && error.code === code)
}

/** Lets pending promise callbacks run, so a request waiting on a timer gets to it. */
const settle = () => new Promise(resolve => setImmediate(resolve))

afterEach(() => {
  mock.restoreAll()
  mock.timers.reset()
})

test('parses the campaign of an Apple Ads install and keeps the whole answer', () => {
  const attribution = parseAppleAdsAttribution({...CAMPAIGN, supplyPlacement: 'search'})

  assert.equal(attribution?.campaignId, 1234567890)
  assert.equal(attribution?.claimType, 'Click')
  assert.equal(attribution?.countryOrRegion, 'US')
  assert.equal(attribution?.payload.supplyPlacement, 'search')
})

test('answers null for an install that did not come from Apple Ads', () => {
  assert.equal(parseAppleAdsAttribution({attribution: false}), null)
})

test('a field of the wrong type or missing reads as null', () => {
  const attribution = parseAppleAdsAttribution({attribution: true, campaignId: '42'})

  assert.equal(attribution?.campaignId, null)
  assert.equal(attribution?.clickDate, null)
})

test('an answer without the attribution flag is unexpected', () => {
  for (const payload of [null, [], 'true', {attribution: 'true'}]) {
    assert.throws(
      () => parseAppleAdsAttribution(payload),
      error => isAppleAdsError(error) && error.code === 'ERR_APPLE_ADS_UNEXPECTED_RESPONSE'
    )
  }
})

test('posts the token as plain text', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => respond(200, CAMPAIGN))

  assert.equal((await resolveAppleAdsAttribution('token'))?.adGroupId, 1234567890)

  const [url, init] = fetch.mock.calls[0]?.arguments ?? []

  assert.equal(url, 'https://api-adservices.apple.com/api/v1/')
  assert.equal(init?.method, 'POST')
  assert.equal(init?.body, 'token')
  assert.deepEqual(init?.headers, {'Content-Type': 'text/plain'})
})

test('retries a 404 three times, 5 s apart, then gives up', async () => {
  mock.timers.enable({apis: ['setTimeout']})
  const fetch = mock.method(globalThis, 'fetch', async () => respond(404))
  const result = rejectsWith(resolveAppleAdsAttribution('token'), 'ERR_APPLE_ADS_NOT_FOUND')

  for (let retry = 1; retry <= 3; retry++) {
    await settle()
    assert.equal(fetch.mock.callCount(), retry)
    mock.timers.tick(4_999)
    await settle()
    assert.equal(fetch.mock.callCount(), retry)
    mock.timers.tick(1)
  }

  await result
  assert.equal(fetch.mock.callCount(), 4)
})

test('a 404 followed by the answer resolves', async () => {
  mock.timers.enable({apis: ['setTimeout']})
  const answers = [respond(404), respond(200, CAMPAIGN)]
  mock.method(globalThis, 'fetch', async () => answers.shift())
  const result = resolveAppleAdsAttribution('token')

  await settle()
  mock.timers.tick(5_000)

  assert.equal((await result)?.orgId, 1234567890)
})

test('maps the HTTP status to a code', async () => {
  for (const [status, code] of [
    [400, 'ERR_APPLE_ADS_INVALID_TOKEN'],
    [500, 'ERR_APPLE_ADS_UNAVAILABLE'],
    [503, 'ERR_APPLE_ADS_UNAVAILABLE'],
    [403, 'ERR_APPLE_ADS_UNEXPECTED_RESPONSE'],
  ] as const) {
    mock.method(globalThis, 'fetch', async () => respond(status))
    await rejectsWith(resolveAppleAdsAttribution('token'), code)
  }
})

test('a request that fails or takes too long is coded', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Network request failed')
  })
  await rejectsWith(resolveAppleAdsAttribution('token'), 'ERR_APPLE_ADS_NETWORK')

  mock.method(globalThis, 'fetch', (_: string, init: RequestInit) => {
    return new Promise((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
  })
  await rejectsWith(resolveAppleAdsAttribution('token', {timeoutMs: 10}), 'ERR_APPLE_ADS_TIMEOUT')
})
