import type { AbTestResult, AlertEvent, AnomalyDetection, Lead, SmartReportInsight } from '../types'

export const getSmartAlerts = (leads: Lead[]): AlertEvent[] => {
  const alerts: AlertEvent[] = []
  const highIntent = leads.filter((lead) => lead.status === 'High Intent')
  const excluded = leads.filter((lead) => lead.exclusion.excluded)
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

  if (excluded.length > 0) {
    alerts.push({
      id: 'excluded-leads',
      severity: excluded.length > 12 ? 'critical' : 'warning',
      title: `${excluded.length} leads are excluded by quality rules`,
      description: 'Data validation and exclusion policies suppressed these leads from active routing.',
      action: 'Review exclusion reasons and refine campaign/source quality controls.',
    })
  }

  return alerts
}

export const getLeadAnomalies = (leads: Lead[]): AnomalyDetection[] => {
  const anomalies: AnomalyDetection[] = []
  if (leads.length === 0) return anomalies

  const bySource = new Map<string, Lead[]>()
  for (const lead of leads) {
    const bucket = bySource.get(lead.source) ?? []
    bucket.push(lead)
    bySource.set(lead.source, bucket)
  }

  for (const [source, sourceLeads] of bySource.entries()) {
    if (sourceLeads.length > leads.length * 0.7) {
      anomalies.push({
        id: `volume-spike-${source}`,
        severity: 'warning',
        title: `${source} volume concentration anomaly`,
        description: `${sourceLeads.length} leads represent more than 70% of current volume.`,
        affectedCount: sourceLeads.length,
      })
    }
  }

  const duplicatePhoneLeads = leads.filter((lead) => lead.validation.duplicatePhone)
  if (duplicatePhoneLeads.length > 0) {
    anomalies.push({
      id: 'duplicate-phone',
      severity: duplicatePhoneLeads.length > 8 ? 'critical' : 'warning',
      title: 'Duplicate phone pattern detected',
      description: 'Multiple leads share identical phone numbers and may indicate low-quality acquisition.',
      affectedCount: duplicatePhoneLeads.length,
    })
  }

  const invalidEmailLeads = leads.filter((lead) => !lead.validation.emailValid || lead.validation.disposableEmail)
  if (invalidEmailLeads.length > 0) {
    anomalies.push({
      id: 'invalid-emails',
      severity: invalidEmailLeads.length > 10 ? 'critical' : 'info',
      title: 'Untrusted email domains detected',
      description:
        'One or more leads include invalid or disposable email addresses and should be quarantined from outreach.',
      affectedCount: invalidEmailLeads.length,
    })
  }

  return anomalies
}

export const getSmartReportInsights = (leads: Lead[]): SmartReportInsight[] => {
  if (leads.length === 0) return []

  const sourceQuality = ['Meta - Facebook', 'Meta - Instagram', 'Email'].map((source) => {
    const scoped = leads.filter((lead) => lead.source === source)
    const avgScore =
      scoped.length === 0
        ? 0
        : Math.round(scoped.reduce((accumulator, lead) => accumulator + lead.score, 0) / scoped.length)
    const highIntentRate =
      scoped.length === 0
        ? 0
        : Math.round((scoped.filter((lead) => lead.status === 'High Intent').length / scoped.length) * 100)
    return { source, count: scoped.length, avgScore, highIntentRate }
  })

  const bestSource = [...sourceQuality].sort((left, right) => right.highIntentRate - left.highIntentRate)[0]
  const worstSource = [...sourceQuality].sort((left, right) => left.avgScore - right.avgScore)[0]
  const nurturePool = leads.filter((lead) => lead.health.classification === 'Nurture').length

  return [
    {
      id: 'best-source',
      title: 'Top Performing Source',
      finding: `${bestSource.source} has the strongest high-intent mix at ${bestSource.highIntentRate}%.`,
      recommendation: `Increase spend allocation to ${bestSource.source} and replicate top-performing creative.`,
      priority: 'High',
    },
    {
      id: 'underperforming-source',
      title: 'Underperforming Segment',
      finding: `${worstSource.source} currently averages a lead score of ${worstSource.avgScore}.`,
      recommendation:
        'Tighten source-level targeting and strengthen campaign-specific scoring thresholds for this channel.',
      priority: 'Medium',
    },
    {
      id: 'nurture-opportunity',
      title: 'Nurture Optimization Opportunity',
      finding: `${nurturePool} leads are in nurture health classification and need staged activation.`,
      recommendation:
        'Launch behavior-triggered nurture programs with pricing-page and quote-request engagement triggers.',
      priority: nurturePool > 12 ? 'High' : 'Low',
    },
  ]
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
