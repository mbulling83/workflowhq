import { LandingScreen } from '@/screens/LandingScreen'
import { showPricingSectionFlag } from './flags'
import '@/screens/LandingPage.css'

export default async function HomePage() {
  const shouldShowPricingSection = await showPricingSectionFlag()

  return <LandingScreen showPricingSection={shouldShowPricingSection} />
}
