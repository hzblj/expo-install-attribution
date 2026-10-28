import {Box, RnScrollView, RnText} from '@hzblj/kara-ui'
import type {ReactNode} from 'react'

/** Every screen of the example: one React Native scroll view under the native large title. */
export const Page = ({children}: {children: ReactNode}) => (
  <RnScrollView
    bg="surface.base"
    content={{gap: 's32', pb: 's80', pt: 's8', px: 's20'}}
    contentInsetAdjustmentBehavior="automatic"
    flex={1}
  >
    {children}
  </RnScrollView>
)

type SectionProps = {
  /** A line under the content: what to notice, or where the platforms differ. */
  caption?: string
  children: ReactNode
  title?: string
}

/** A titled block of a page, in the style of a grouped list's header and footer. */
export const Section = ({caption, children, title}: SectionProps) => (
  <Box gap="s8">
    {title ? (
      <RnText color="content.secondary" variant="footnoteMedium">
        {title.toUpperCase()}
      </RnText>
    ) : null}
    {children}
    {caption ? (
      <RnText color="content.tertiary" variant="footnote">
        {caption}
      </RnText>
    ) : null}
  </Box>
)
