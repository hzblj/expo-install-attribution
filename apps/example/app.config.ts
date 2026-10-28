import type {ExpoConfig} from 'expo/config'

// Not "Expo Install Attribution": the generated Xcode target would be `ExpoInstallAttribution`, the Swift module of the
// package.
const NAME = 'Attribution'
const BUNDLE_ID = 'com.hzblj.expoinstallattribution.example'

export default {
  android: {
    package: BUNDLE_ID,
  },
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
  },
  name: NAME,
  orientation: 'portrait',
  plugins: [
    'expo-router',
    '@hzblj/kara-ui',
    // The scene life cycle, which apps built with the iOS 27 SDK need or they stop at launch: Expo 57's template has
    // none, so React Native starts from Expo's scene delegate instead. Remove it with the move to Expo 58.
    ['expo-build-properties', {ios: {enableSceneSupport: true}}],
  ],
  scheme: 'install-attribution-example',
  slug: 'expo-install-attribution-example',
  userInterfaceStyle: 'automatic',
  version: '1.0.0',
} satisfies ExpoConfig
