"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

const axisStyle = { fill: "#94a3b8", fontSize: 12 };
const tooltipStyle = {
  backgroundColor: "#0f1424",
  border: "1px solid #1e2740",
  borderRadius: 12,
  color: "#e2e8f0",
  fontSize: 12,
};

/** Rata-rata tiap variabel (data nyata dari respondent_assessments). */
export function VariableAverageChart({
  data,
}: {
  data: { name: string; average: number; isTop: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={axisStyle} stroke="#334155" />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ ...axisStyle, fontSize: 11 }}
          stroke="#334155"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(99,102,241,0.08)" }}
          formatter={(value) => [Number(value).toFixed(3), "Rata-rata"]}
        />
        <Bar dataKey="average" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.isTop ? "#6366f1" : "#334155"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Distribusi bobot TOP 5 (total selalu 1). */
export function WeightPieChart({ data }: { data: { name: string; weight: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="weight"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          stroke="#0a0e1a"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [`${(Number(value) * 100).toFixed(2)}%`, String(name)]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          iconType="circle"
          formatter={(value) => <span style={{ color: "#94a3b8" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Skor akhir GPU hasil weighted average. */
export function RankingChart({ data }: { data: { name: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={axisStyle} stroke="#334155" />
        <YAxis
          type="category"
          dataKey="name"
          width={170}
          tick={{ ...axisStyle, fontSize: 11 }}
          stroke="#334155"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(52,211,153,0.08)" }}
          formatter={(value) => [Number(value).toFixed(4), "Skor"]}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((_, index) => (
            <Cell key={index} fill={index === 0 ? "#34d399" : CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Perbandingan profil nilai assessment antar GPU pada variabel TOP 5. */
export function GpuRadarChart({
  variables,
  series,
}: {
  variables: string[];
  series: { name: string; values: number[] }[];
}) {
  const data = variables.map((variable, index) => {
    const row: Record<string, string | number> = { variable };
    series.forEach((serie) => {
      row[serie.name] = serie.values[index] ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#1e2740" />
        <PolarAngleAxis dataKey="variable" tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fill: "#475569", fontSize: 10 }} stroke="#1e2740" />
        {series.map((serie, index) => (
          <Radar
            key={serie.name}
            name={serie.name}
            dataKey={serie.name}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="circle"
          formatter={(value) => <span style={{ color: "#94a3b8" }}>{value}</span>}
        />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Distribusi jawaban Likert 1–5 untuk seluruh responden. */
export function LikertDistributionChart({
  data,
}: {
  data: { label: string; jumlah: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
        <XAxis dataKey="label" tick={{ ...axisStyle, fontSize: 11 }} stroke="#334155" />
        <YAxis allowDecimals={false} tick={axisStyle} stroke="#334155" />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(99,102,241,0.08)" }}
          formatter={(value) => [Number(value), "Jawaban"]}
        />
        <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} barSize={44}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
