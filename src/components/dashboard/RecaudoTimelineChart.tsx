import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOP, formatFecha } from "../../lib/format";
import type { Payment } from "../../types";

export function RecaudoTimelineChart({ payments }: { payments: Payment[] }) {
  const data = useMemo(() => {
    const porFecha = new Map<string, number>();
    for (const p of payments) {
      porFecha.set(p.fecha, (porFecha.get(p.fecha) ?? 0) + p.monto);
    }
    const fechas = [...porFecha.keys()].sort();
    let acumulado = 0;
    return fechas.map((fecha) => {
      acumulado += porFecha.get(fecha) ?? 0;
      return { fecha, acumulado };
    });
  }, [payments]);

  if (data.length === 0) {
    return <p className="text-sm text-text-muted">Aún no se han registrado abonos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis
          dataKey="fecha"
          tickFormatter={(v) => formatFecha(v)}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCOP(v)}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
          width={90}
        />
        <Tooltip
          labelFormatter={(v) => formatFecha(String(v))}
          formatter={(value) => [formatCOP(Number(value)), "Recaudo acumulado"]}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--gridline)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        />
        <Line
          type="monotone"
          dataKey="acumulado"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--series-1)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
