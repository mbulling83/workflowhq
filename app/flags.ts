import { flag } from '@vercel/flags/next'

export const showPricingSectionFlag = flag<boolean>({
  key: 'show-pricing-section',
  decide() {
    return false
  },
})
