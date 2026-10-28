import {useAppTheme} from '@hzblj/kara-ui'
import {Stack} from 'expo-router'

import {Providers} from '../src/providers'

const RootStack = () => {
  const theme = useAppTheme()

  return (
    <Stack
      screenOptions={{
        contentStyle: {backgroundColor: theme.color('surface.base')},
        headerLargeTitle: true,
        title: 'Attribution',
      }}
    />
  )
}

export default function RootLayout() {
  return (
    <Providers>
      <RootStack />
    </Providers>
  )
}
