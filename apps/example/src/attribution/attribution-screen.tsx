import {
  type AppleAdsAttribution,
  getAppleAdsAttributionToken,
  getInstallReferrer,
  type InstallReferrer,
  resolveAppleAdsAttribution,
} from '@hzblj/expo-install-attribution'
import {ActivityIndicator, Box, Button, Divider, Island, LabeledContent, RnText, VStack} from '@hzblj/kara-ui'
import {useLocalSearchParams} from 'expo-router'
import {Fragment, type ReactNode, useCallback} from 'react'
import {Platform, Settings} from 'react-native'

import {Page, Section} from '../ui'
import {SAMPLE_CAMPAIGN, SAMPLE_REFERRER, SAMPLE_TOKEN} from './samples'
import {type Call, useCall} from './use-call'

type Row = [label: string, value: string]

/** A Play timestamp in seconds, `0` when Play doesn't know it. */
const time = (seconds: number) =>
  seconds > 0 ? new Date(seconds * 1000).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'medium'}) : 'Unknown'

const orNull = (value: number | string | null) => (value === null ? 'null' : String(value))

const referrerRows = (referrer: InstallReferrer): Row[] => [
  ['Clicked', time(referrer.referrerClickTimestampSeconds)],
  ['Install began', time(referrer.installBeginTimestampSeconds)],
  ['Clicked, Google', time(referrer.referrerClickTimestampServerSeconds)],
  ['Install began, Google', time(referrer.installBeginTimestampServerSeconds)],
  ['First version', orNull(referrer.installVersion)],
  ['Google Play Instant', String(referrer.googlePlayInstant)],
]

const campaignRows = (attribution: AppleAdsAttribution): Row[] => [
  ['Campaign', orNull(attribution.campaignId)],
  ['Ad group', orNull(attribution.adGroupId)],
  ['Keyword', orNull(attribution.keywordId)],
  ['Ad', orNull(attribution.adId)],
  ['Organization', orNull(attribution.orgId)],
  ['Conversion', orNull(attribution.conversionType)],
  ['Claim', orNull(attribution.claimType)],
  ['Storefront', orNull(attribution.countryOrRegion)],
  ['Clicked', orNull(attribution.clickDate)],
]

const Card = ({children}: {children: ReactNode}) => (
  <Island>
    <VStack bg="surface.primary" borderRadius="large" px="s16" py="s4" wide>
      {children}
    </VStack>
  </Island>
)

const Rows = ({rows}: {rows: Row[]}) => (
  <Card>
    {rows.map(([label, value], index) => (
      <Fragment key={label}>
        {index > 0 ? <Divider /> : null}
        <LabeledContent label={label} value={value} />
      </Fragment>
    ))}
  </Card>
)

/** A long value on a line of its own, under its label. */
const Value = ({label, value}: {label: string; value: string}) => (
  <Box bg="surface.primary" borderRadius="large" gap="s4" px="s16" py="s12">
    <RnText color="content.secondary" variant="footnote">
      {label}
    </RnText>
    <RnText monospaced selectable variant="subheadline">
      {value}
    </RnText>
  </Box>
)

type OutcomeProps<T> = {
  call: Call<T | null>
  /** The function's name, the row's label when it answers `null`. */
  name: string
  render: (value: T) => ReactNode
}

/** What a call settled with: its own rendering, `null`, a spinner or the error's code. */
const Outcome = <T,>({call, name, render}: OutcomeProps<T>) => {
  if (call.status === 'pending') {
    return (
      <Box align="center" bg="surface.primary" borderRadius="large" p="s16">
        <ActivityIndicator />
      </Box>
    )
  }

  if (call.status === 'rejected') {
    return (
      <Box bg="surface.primary" borderRadius="large" entering="fadeUp" gap="s4" p="s16">
        <RnText color="content.destructive" variant="footnoteMedium">
          {call.code}
        </RnText>
        <RnText color="content.secondary" variant="footnote">
          {call.message}
        </RnText>
      </Box>
    )
  }

  return call.value === null ? <Rows rows={[[name, 'null']]} /> : render(call.value)
}

/**
 * `?sample=1` (or the `sample` launch argument on iOS, `-sample 1`) answers with the samples instead of asking the
 * stores, on the platform each store belongs to.
 */
const useSample = () => {
  const {sample} = useLocalSearchParams<{sample?: string}>()

  return sample === '1' || (Platform.OS === 'ios' && String(Settings.get('sample')) === '1')
}

const GooglePlay = ({sample}: {sample: boolean}) => {
  const ask = useCallback(
    () => (sample ? Promise.resolve(Platform.OS === 'android' ? SAMPLE_REFERRER : null) : getInstallReferrer()),
    [sample]
  )
  const [call] = useCall(ask)

  return (
    <Section caption={Platform.OS === 'android' ? undefined : 'Android only'} title="Google Play">
      <Outcome
        call={call}
        name="getInstallReferrer()"
        render={referrer => (
          <>
            <Value label="Referrer" value={referrer.installReferrer || '""'} />
            <Rows rows={referrerRows(referrer)} />
          </>
        )}
      />
    </Section>
  )
}

const AppleAds = ({sample}: {sample: boolean}) => {
  const ask = useCallback(
    () => (sample ? Promise.resolve(Platform.OS === 'ios' ? SAMPLE_TOKEN : null) : getAppleAdsAttributionToken()),
    [sample]
  )
  const [token, retry] = useCall(ask)

  return (
    <Section caption={Platform.OS === 'ios' ? undefined : 'iOS only'} title="Apple Ads">
      <Outcome
        call={token}
        name="getAppleAdsAttributionToken()"
        render={value => (
          <>
            <Value label="Token" value={`${value.slice(0, 32)}…`} />
            <Campaign retry={retry} sample={sample} token={value} />
          </>
        )}
      />
    </Section>
  )
}

/** The token posted to Apple. Ask again fetches a new token, which posts again. */
const Campaign = ({retry, sample, token}: {retry: () => void; sample: boolean; token: string}) => {
  const resolve = useCallback(
    () => (sample ? Promise.resolve(SAMPLE_CAMPAIGN) : resolveAppleAdsAttribution(token)),
    [sample, token]
  )
  const [call] = useCall(resolve)

  return (
    <>
      <Outcome call={call} name="resolveAppleAdsAttribution()" render={value => <Rows rows={campaignRows(value)} />} />
      <Island>
        <Button disabled={call.status === 'pending'} label="Ask again" onPress={retry} variant="secondary" />
      </Island>
    </>
  )
}

/** Both stores' answers for this install, live: the platform's own store first. */
export const AttributionScreen = () => {
  const sample = useSample()
  const play = <GooglePlay key="play" sample={sample} />
  const appleAds = <AppleAds key="apple" sample={sample} />

  return <Page>{Platform.OS === 'ios' ? [appleAds, play] : [play, appleAds]}</Page>
}
