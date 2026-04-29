interface KpiCardProps {
  title: string
  value: string | number
  trend: string
}

export const KpiCard = ({ title, value, trend }: KpiCardProps) => (
  <article className="surface kpi-card">
    <p className="kpi-label">{title}</p>
    <p className="kpi-value">{value}</p>
    <p className="kpi-delta">{trend}</p>
  </article>
)
