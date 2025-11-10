"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const defaultChartData = [
  { month: "Jan", revenue: 5200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 5400 },
  { month: "Apr", revenue: 6200 },
  { month: "May", revenue: 6800 },
  { month: "Jun", revenue: 6400 },
  { month: "Jul", revenue: 7200 },
  { month: "Aug", revenue: 8800 },
  { month: "Sep", revenue: 8200 },
  { month: "Oct", revenue: 9400 },
  { month: "Nov", revenue: 10200 },
  { month: "Dec", revenue: 11000 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "rgb(16, 185, 129)",
  },
};

interface RevenueChartProps {
  chartData?: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ chartData }: RevenueChartProps) {
  const data = chartData && chartData.length > 0 ? chartData : defaultChartData;

  return (
    <Card className="bg-[#0f0f0f] border-zinc-800/50 p-4 md:p-6">
      <ChartContainer
        config={chartConfig}
        className="h-[300px] md:h-[400px] w-full"
      >
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="rgb(16, 185, 129)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="rgb(16, 185, 129)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)},000`}
            ticks={[0, 2000, 4000, 6000, 8000, 10000, 12000]}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="rgb(16, 185, 129)"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            fillOpacity={1}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
