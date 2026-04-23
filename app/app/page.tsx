import { showPricingSectionFlag } from '../flags'
import { DashboardRouteClient } from './DashboardRouteClient'

export default async function DashboardRoute() {
  const shouldShowPricingSection = await showPricingSectionFlag()

  return <DashboardRouteClient showBillingSection={shouldShowPricingSection} />
}
