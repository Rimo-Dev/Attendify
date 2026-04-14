import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({ data }: { data: Array<{ month: string; present: number; late: number }> }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#5d6478" />
          <YAxis stroke="#5d6478" />
          <Tooltip />
          <Line type="monotone" dataKey="present" stroke="#0f766e" strokeWidth={3} />
          <Line type="monotone" dataKey="late" stroke="#dc2626" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
