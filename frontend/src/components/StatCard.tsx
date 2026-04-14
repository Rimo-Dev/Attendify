interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatCard({ label, value, accent = "var(--accent)" }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value" style={{ color: accent }}>
        {value}
      </strong>
    </article>
  );
}
