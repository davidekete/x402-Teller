"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { RevenueChart, type Transaction } from "./components/revenue-chart";
import { PaymentsTable } from "./components/payments-table";
import { EndpointsTable } from "./components/endpoints-table";
import { WithdrawModal } from "./components/withdraw-modal";
import { useWallet } from "@solana/wallet-adapter-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { fetchTransactions, fetchBalance } from "@/lib/api";
import { LogOut, TrendingDown, TrendingUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const defaultPayments: Transaction[] = [];

/**
 * Calculate total revenue from all settled transactions.
 */
function calculateTotalRevenue(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

/**
 * Calculate YoY revenue change percentage.
 * Compares current year settled revenue to previous year settled revenue.
 */
function calculateRevenueChange(transactions: Transaction[]): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const currentYearRevenue = transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const timeStr = tx.time ?? tx.createdAt ?? tx.updatedAt;
    if (!timeStr) return sum;
    const date = new Date(timeStr);
    if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const previousYearRevenue = transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const timeStr = tx.time ?? tx.createdAt ?? tx.updatedAt;
    if (!timeStr) return sum;
    const date = new Date(timeStr);
    if (isNaN(date.getTime()) || date.getFullYear() !== previousYear)
      return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  if (previousYearRevenue === 0) return 0;
  return Math.round(
    ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
  );
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("1 Year");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const router = useRouter();
  const { data: session } = useSession();

  // Effect: Redirect when accessing dashboard without session
  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  // Load wallet balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        // Load USDC balance on devnet
        const usdcResult = await fetchBalance("solana-devnet");
        if (usdcResult.success && usdcResult.balance !== undefined) {
          setUsdcBalance(usdcResult.balance / 1_000_000);
        }
      } catch (err) {
        console.error("Failed to load balance:", err);
      }
    };

    if (session) {
      loadBalance();
      // Refresh every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const { publicKey, disconnect, connect, connected, wallet, select, wallets } =
    useWallet();

  // Detect wallet changes and log out if wallet address changes
  useEffect(() => {
    if (session && publicKey) {
      const sessionWallet = (session.user as any)?.walletAddress; // The wallet address from session
      const currentWallet = publicKey.toBase58();

      // If the connected wallet doesn't match the authenticated wallet, log out
      if (sessionWallet && sessionWallet !== currentWallet) {
        console.log("Wallet mismatch detected!");
        console.log("Session wallet:", sessionWallet);
        console.log("Current wallet:", currentWallet);
        console.log("Logging out...");
        disconnect();
        signOut({ redirect: true, callbackUrl: "/" });
      }
    }
  }, [session, publicKey, disconnect]);

  // Auto-reconnect wallet if disconnected but session exists
  useEffect(() => {
    const reconnectWallet = async () => {
      if (session && !connected) {
        // If no wallet is selected but wallets are available, select the first one
        if (!wallet && wallets.length > 0) {
          try {
            select(wallets[0].adapter.name);
          } catch (err) {
            console.error("Failed to select wallet:", err);
          }
        }

        // If wallet is selected but not connected, try to connect
        if (wallet) {
          try {
            await connect();
          } catch (err) {
            console.error("Failed to reconnect wallet:", err);
          }
        }
      }
    };

    reconnectWallet();
  }, [session, connected, wallet, wallets, connect, select]);

  const {
    data,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useSWR("transactions", () => fetchTransactions(20, 0), {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });
  const transactions = data?.length ? data : defaultPayments;

  const totalRevenue = calculateTotalRevenue(defaultPayments);
  const revenueChange = calculateRevenueChange(defaultPayments);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white container mx-auto">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800/50">
            <Image
              src="/solana.png"
              alt="Solana Logo"
              width={30}
              height={30}
              className="rounded-full"
            />
            <span className="text-sm font-mono">
              {publicKey
                ? (() => {
                    const pk = publicKey.toBase58();
                    return `${pk.slice(0, 9)}...${pk.slice(-4)}`;
                  })()
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={async () => {
                disconnect();
                await signOut({ redirect: true, callbackUrl: "/" });
              }}
              aria-label="Sign out"
              className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
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
                <div
                  className={`flex items-center gap-1 text-sm md:text-base ${
                    revenueChange >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(revenueChange)}% (Year)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {/* Balance Display */}
              <div className="bg-zinc-900/50 rounded-2xl px-4 py-2 border border-zinc-800/50">
                <div className="text-xs text-zinc-400 mb-1">
                  Available Balance
                </div>
                <div className="text-2xl font-bold">
                  ${usdcBalance.toFixed(2)} USDC
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
          <RevenueChart
            transactions={transactions}
            isLoading={transactionsLoading}
            error={transactionsError}
          />
        </div>

        {/* Desktop Layout: Payments and Endpoints side by side */}
        <div className="hidden md:flex gap-8 mb-8">
          <PaymentsTable
            transactions={transactions}
            isLoading={transactionsLoading}
            error={transactionsError}
          />
          <EndpointsTable />
        </div>

        {/* Mobile Layout: Stacked */}
        <div className="md:hidden space-y-8">
          <EndpointsTable />
          <PaymentsTable
            transactions={transactions}
            isLoading={transactionsLoading}
            error={transactionsError}
          />
        </div>
      </main>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
}
