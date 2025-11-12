"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, AlertCircle } from "lucide-react";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "rgb(16, 185, 129)",
  },
};

export interface Transaction {
  txID: number;
  client: string;
  txHash: string;
  amount: string;
  endpoint: string;
  network?: string | null;
  asset?: string | null;
  status: "pending" | "verified" | "settled" | "failed";
  time: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RevenueChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
  error?: Error | null;
}

function computeChartDataFromTransactions(transactions: Transaction[]) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentYear = new Date().getFullYear();
  const sums = new Array(12).fill(0);

  for (const tx of transactions) {
    if (tx.status !== "settled") continue;

    const timeStr = tx.time ?? tx.createdAt ?? tx.updatedAt;
    if (!timeStr) continue;

    const date = new Date(timeStr);
    if (isNaN(date.getTime())) continue;

    // Only include transactions from the current year
    if (date.getFullYear() !== currentYear) continue;

    const month = date.getMonth(); // 0-11

    // sanitize amount string (remove currency symbols, commas, whitespace)
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    if (isNaN(num)) continue;

    sums[month] += num;
  }

  return monthNames.map((m, i) => ({ month: m, revenue: Math.round(sums[i]) }));
}

export function RevenueChart({
  transactions,
  isLoading,
  error,
}: RevenueChartProps) {
  if (error) {
    return (
      <Card className="bg-[#0f0f0f] border-zinc-800/50 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-[300px] md:h-[400px] text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            Failed to Load Revenue Data
          </h3>
          <p className="text-sm text-zinc-400 max-w-md">
            {error.message ||
              "An error occurred while loading revenue data. Please try again later."}
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-[#0f0f0f] border-zinc-800/50 p-4 md:p-6">
        <div className="flex items-center justify-center h-[300px] md:h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading revenue data...</p>
          </div>
        </div>
      </Card>
    );
  }

  const hasTransactions = transactions && transactions.length > 0;
  const computedChartData = hasTransactions
    ? computeChartDataFromTransactions(transactions)
    : [];

  const hasSettledTransactions = computedChartData.some((d) => d.revenue > 0);

  if (!hasTransactions || !hasSettledTransactions) {
    return (
      <Card className="bg-[#0f0f0f] border-zinc-800/50 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-[300px] md:h-[400px] text-center">
          <TrendingUp className="w-12 h-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            No Revenue Data Yet
          </h3>
          <p className="text-sm text-zinc-400 max-w-md">
            {!hasTransactions
              ? "Start accepting payments to see your revenue trends here."
              : "Settled transactions will appear here once payments are processed."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0f0f0f] border-zinc-800/50 p-4 md:p-6">
      <ChartContainer
        config={chartConfig}
        className="h-[300px] md:h-[400px] w-full"
      >
        <AreaChart
          data={computedChartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
            tickFormatter={(value) => {
              const num = Number(value ?? 0);
              if (Number.isNaN(num)) return "";
              // Format with thousand separators, no fraction digits
              return new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 0,
              }).format(num);
            }}
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
