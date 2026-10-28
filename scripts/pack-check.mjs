/**
 * Checks what npm would receive, the way a consumer meets it. Packs every published package (each `prepack` builds it
 * through turbo's cache), asserts what must and must not ship in each tarball, then installs it into a throwaway app
 * and type-checks real usage with a consumer's TypeScript: no `source` condition, no workspace links, only what the
 * tarball declares.
 *
 * The negative cases matter as much as the positive ones: if a declaration failed to resolve, its imports would
 * quietly become `any` and everything would compile, so each `@ts-expect-error` is there to prove the types are real.
 */
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const WORK = path.join(ROOT, '.pack-check')

const run = (command, args, cwd = ROOT) => execFileSync(command, args, {cwd, encoding: 'utf8'})

const fail = message => {
  console.error(`pack-check: ${message}`)
  process.exit(1)
}

const REQUIRED = {
  '@hzblj/expo-install-attribution': [
    'package.json',
    'README.md',
    'LICENSE',
    'build/index.js',
    'build/index.d.ts',
    'expo-module.config.json',
    'ios/ExpoInstallAttribution.podspec',
    'ios/ExpoInstallAttributionModule.swift',
    'android/build.gradle',
    'android/src/main/AndroidManifest.xml',
    'android/src/main/java/com/hzblj/expoinstallattribution/ExpoInstallAttributionModule.kt',
  ],
}

// The tests, the TypeScript sources and the build output of the native projects stay home.
const FORBIDDEN = [/^src\//, /^test\//, /\/build\/intermediates\//, /\.DS_Store$/]

const packages = []

for (const directory of await readdir(path.join(ROOT, 'packages'))) {
  const manifestPath = path.join(ROOT, 'packages', directory, 'package.json')

  if (!existsSync(manifestPath)) {
    continue
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  if (!manifest.private) {
    packages.push({directory, name: manifest.name})
  }
}

await rm(WORK, {force: true, recursive: true})
await mkdir(path.join(WORK, 'tarballs'), {recursive: true})

let fileCount = 0

for (const {directory, name} of packages) {
  const tarball = path.join(WORK, 'tarballs', `${directory}.tgz`)

  run('yarn', ['pack', '--out', tarball], path.join(ROOT, 'packages', directory))

  const files = run('tar', ['-tzf', tarball])
    .split('\n')
    .filter(Boolean)
    .map(file => file.replace(/^package\//, ''))

  const missing = (REQUIRED[name] ?? ['package.json', 'README.md']).filter(file => !files.includes(file))
  const leaked = files.filter(file => FORBIDDEN.some(pattern => pattern.test(file)))

  if (missing.length > 0) {
    fail(`${name} is missing:\n  ${missing.join('\n  ')}`)
  }

  if (leaked.length > 0) {
    fail(`${name} must not ship:\n  ${leaked.join('\n  ')}`)
  }

  const packed = JSON.parse(run('tar', ['-xzOf', tarball, 'package/package.json']))

  if (JSON.stringify(packed.dependencies ?? {}).includes('workspace:')) {
    fail(`${name} still declares a workspace: range: it would not install outside this repo`)
  }

  const installed = path.join(WORK, 'node_modules', name)

  await mkdir(installed, {recursive: true})
  run('tar', ['-xzf', tarball, '-C', installed, '--strip-components', '1'])
  fileCount += files.length
}

const consumer = `import {
  type AppleAdsAttribution,
  AppleAdsAttributionError,
  type AppleAdsErrorCode,
  getAppleAdsAttribution,
  getAppleAdsAttributionToken,
  getInstallReferrer,
  type InstallReferrer,
  type InstallReferrerErrorCode,
  isAppleAdsError,
  isInstallReferrerError,
  isPermanentInstallReferrerError,
  parseAppleAdsAttribution,
  resolveAppleAdsAttribution,
} from '@hzblj/expo-install-attribution'

export const claim = async () => {
  try {
    const referrer: InstallReferrer | null = await getInstallReferrer({timeoutMs: 5_000})
    const source: string | undefined = referrer?.installReferrer
    const clicked: number | undefined = referrer?.referrerClickTimestampServerSeconds

    return {clicked, source}
  } catch (error) {
    if (isInstallReferrerError(error)) {
      const code: InstallReferrerErrorCode = error.code

      return {code, retry: !isPermanentInstallReferrerError(error)}
    }

    throw error
  }
}

export const campaign = async (): Promise<number | null> => {
  const token: string | null = await getAppleAdsAttributionToken()
  const resolved: AppleAdsAttribution | null = token ? await resolveAppleAdsAttribution(token, {timeoutMs: 5_000}) : null

  return resolved?.campaignId ?? (await getAppleAdsAttribution())?.campaignId ?? null
}

export const parsed = parseAppleAdsAttribution({attribution: false})

export const coded = (error: unknown): AppleAdsErrorCode | null => (isAppleAdsError(error) ? error.code : null)

export const thrown = new AppleAdsAttributionError('ERR_APPLE_ADS_TIMEOUT', 'timeout')

// @ts-expect-error: not a code
export const wrong = new AppleAdsAttributionError('ERR_TIMEOUT', 'timeout')

// @ts-expect-error: the timeout is a number
getInstallReferrer({timeoutMs: '5s'})

// @ts-expect-error: the token is a string
resolveAppleAdsAttribution(42)
`

await writeFile(path.join(WORK, 'consumer.tsx'), consumer)
await writeFile(
  path.join(WORK, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {noEmit: true, skipLibCheck: true, strict: true},
      extends: 'expo/tsconfig.base',
      include: ['consumer.tsx'],
    },
    null,
    2
  )
)

try {
  run('yarn', ['run', '-T', 'tsc', '-p', WORK])
} catch (error) {
  fail(`a consumer's type check failed:\n${error.stdout}`)
}

await rm(WORK, {force: true, recursive: true})

console.log(`pack-check: ${packages.length} package, ${fileCount} files, and a consumer type-checks`)
