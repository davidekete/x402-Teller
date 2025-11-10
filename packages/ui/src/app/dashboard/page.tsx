"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "./components/revenue-chart";
import { PaymentsTable } from "./components/payments-table";
import { EndpointsTable } from "./components/endpoints-table";
import { MobileNav } from "./components/mobile-nav";
import { WithdrawModal } from "./components/withdraw-modal";
import { TrendingUp, Upload, Settings, Copy } from "lucide-react";
import { fetchDashboardStats } from "../../lib/api";

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("1 Year");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const { data: dashboardStats, error } = useSWR(
    "dashboard-stats",
    fetchDashboardStats,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const totalRevenue = dashboardStats?.totalRevenue || 11400;
  const revenueChange = dashboardStats?.revenueChange || 25;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">xAO2</div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800/50">
              <div className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="w-3 h-3 rounded-sm bg-zinc-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-blue-500 to-purple-600" />
                </div>
              </div>
              <span className="text-sm font-mono">4C4zJfsdr...67aB</span>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 lg:px-8 pb-24 md:pb-8">
        {/* Mobile Header Section */}
        <div className="md:hidden mb-6">
          <h1 className="text-4xl font-bold mb-1">Home</h1>
        </div>

        {/* Revenue Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm text-zinc-400 mb-2">Total Revenue</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-bold">
                  ${totalRevenue.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-emerald-500 text-sm md:text-base">
                  <TrendingUp className="w-4 h-4" />
                  <span>{revenueChange}% (Year)</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700/50 gap-2 rounded-full px-6"
            >
              <Upload className="w-4 h-4" />
              withdraw
            </Button>
          </div>

          {/* Time Period Selector - Mobile */}
          <div className="md:hidden flex gap-2 mb-6 overflow-x-auto">
            {["24h", "7d", "30d", "1 Year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedPeriod === period
                    ? "bg-zinc-800 text-white"
                    : "bg-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Chart */}
          <RevenueChart chartData={dashboardStats?.chartData} />
        </div>

        {/* Desktop Layout: Payments and Endpoints side by side */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 mb-8">
          <PaymentsTable />
          <EndpointsTable />
        </div>

        {/* Mobile Layout: Stacked */}
        <div className="md:hidden space-y-8">
          <EndpointsTable />
          <PaymentsTable />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
}
