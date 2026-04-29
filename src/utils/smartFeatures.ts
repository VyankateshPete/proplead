import type { AbTestResult, AlertEvent, Lead } from '../types'

export const getSmartAlerts = (leads: Lead[]): AlertEvent[] => {
  const alerts: AlertEvent[] = []
  const highIntent = leads.filter((lead) => lead.status === 'High Intent')
  const inactive = leads.filter((lead) => {
    const daysSinceEngagement =
      (Date.now() - new Date(lead.behavioral.lastEngagedAt).getTime()) / 86_400_000
    return daysSinceEngagement > 10 && (lead.status === 'Qualified' || lead.status === 'Nurturing')
  })

  if (highIntent.length > 0) {
    alerts.push({
      id: 'high-intent-batch',
      severity: 'critical',
      title: `${highIntent.length} high-intent leads require immediate action`,
      description: 'These leads crossed the high-intent threshold in recent activity windows.',
      action: 'Route to sales queue and initiate priority follow-up.',
    })
  }

  if (inactive.length > 0) {
    alerts.push({
      id: 'inactive-qualified',
      severity: 'warning',
      title: `${inactive.length} qualified leads are inactive`,
      description: 'Leads have not engaged for over 10 days and may require reactivation.',
      action: 'Trigger re-engagement campaign and assign owner.',
    })
  }

  const complianceIssues = leads.filter((lead) => !lead.compliance.compliant)
  if (complianceIssues.length > 0) {
    alerts.push({
      id: 'compliance-review',
      severity: 'info',
      title: `${complianceIssues.length} leads need compliance review`,
      description: 'TCPA or opt-out status issues were detected during lead processing.',
      action: 'Review consent flags before outreach.',
    })
  }

  return alerts
}

export const getAbTestResults = (leads: Lead[]): AbTestResult[] => {
  const highIntentRate = (subset: Lead[]) =>
    subset.length === 0
      ? 0
      : subset.filter((lead) => lead.status === 'High Intent').length / subset.length

  const metaLeads = leads.filter((lead) => lead.source !== 'Email')
  const emailLeads = leads.filter((lead) => lead.source === 'Email')
  const highUnit = leads.filter((lead) => lead.unitCount >= 20)
  const lowUnit = leads.filter((lead) => lead.unitCount < 20)

  const metaLift = (highIntentRate(metaLeads) - highIntentRate(emailLeads)) * 100
  const highUnitLift = (highIntentRate(highUnit) - highIntentRate(lowUnit)) * 100

  return [
    {
      id: 'ab-capture-form',
      experiment: 'Lead capture form CTA',
      control: 'Get Quote',
      variant: 'Get Free Multifamily Quote',
      winner: highUnitLift > 0 ? 'Variant' : 'Control',
      liftPct: Number(Math.abs(highUnitLift).toFixed(1)),
    },
    {
      id: 'ab-email-subject',
      experiment: 'Nurture email subject line',
      control: 'Your Commercial Insurance Options',
      variant: 'Reduce Multifamily Insurance Cost Today',
      winner: metaLift > 0 ? 'Variant' : 'Control',
      liftPct: Number(Math.abs(metaLift).toFixed(1)),
    },
    {
      id: 'ab-ad-creative',
      experiment: 'Meta ad creative',
      control: 'Static building image',
      variant: 'Carousel with pricing proof points',
      winner: metaLift >= 2 ? 'Variant' : 'Control',
      liftPct: Number(Math.abs(metaLift + 1.4).toFixed(1)),
    },
  ]
}
