import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOP } from "../../lib/format";

export interface VentasPorLocalidadDatum {
  nombre: string;
  recaudado: number;
  pendiente: number;
}

export function VentasPorLocalidadChart({ data }: { data: VentasPorLocalidadDatum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">Aún no hay localidades configuradas.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 56)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        barCategoryGap={16}
      >
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCOP(v)}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          width={120}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          formatter={(value) => formatCOP(Number(value))}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--gridline)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Bar dataKey="recaudado" stackId="v" name="Recaudado" fill="var(--series-1)" radius={[4, 0, 0, 4]} barSize={20} />
        <Bar dataKey="pendiente" stackId="v" name="Pendiente" fill="var(--status-neutral)" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
