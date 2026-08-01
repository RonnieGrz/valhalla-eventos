import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PalcoEstadoChartProps {
  disponibles: number;
  separados: number;
  vendidos: number;
}

const data = (p: PalcoEstadoChartProps) => [
  { estado: "Disponibles", cantidad: p.disponibles, color: "var(--status-neutral)" },
  { estado: "Separados", cantidad: p.separados, color: "var(--status-warning)" },
  { estado: "Vendidos", cantidad: p.vendidos, color: "var(--status-good)" },
];

export function PalcoEstadoChart(props: PalcoEstadoChartProps) {
  const chartData = data(props);
  const total = props.disponibles + props.separados + props.vendidos;

  if (total === 0) {
    return <p className="text-sm text-text-muted">Esta localidad aún no tiene palcos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="estado"
          width={90}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--gridline)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        />
        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
          {chartData.map((entry) => (
            <Cell key={entry.estado} fill={entry.color} />
          ))}
          <LabelList
            dataKey="cantidad"
            position="right"
            style={{ fill: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
