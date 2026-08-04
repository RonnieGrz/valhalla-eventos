interface StatCardProps {
  label: string;
  value: string;
  accentClass?: string;
}

export function StatCard({ label, value, accentClass = "text-text-primary" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}
