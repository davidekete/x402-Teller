"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

  // Fetch dashboard stats with SWR
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR(session ? `${backendUrl}/facilitator/dashboard` : null, fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
    revalidateOnFocus: true, // Refresh when window gains focus
    onError: (err) => {
      console.error("Stats fetch error:", err);
    },
  });

  // Fetch transactions with SWR
  const {
    data: transactions,
    error: transactionsError,
    isLoading: transactionsLoading,
    mutate: mutateTransactions,
  } = useSWR(
    session
      ? `${backendUrl}/facilitator/dashboard/transactions?limit=10`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      onError: (err) => {
        console.error("Transactions fetch error:", err);
      },
    }
  );

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {/* Wallet Info */}
        <div className="bg-[#202020] rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Welcome back!
          </h2>
          <p className="text-gray-400">
            Wallet: {session?.user?.walletAddress}
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="bg-[#202020] rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Statistics</h2>

          {statsLoading && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading stats...</p>
            </div>
          )}

          {statsError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-1">Failed to load statistics</p>
              <p className="text-red-400/80 text-sm">
                {statsError.message || "Could not connect to backend server"}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Make sure your backend is running at {backendUrl}
              </p>
              <button
                onClick={() => mutateStats()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#171717] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-white text-2xl font-bold">
                  {stats.totalTransactions || 0}
                </p>
              </div>
              <div className="bg-[#171717] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Volume</p>
                <p className="text-white text-2xl font-bold">
                  {stats.totalVolume || "0"}
                </p>
              </div>
              <div className="bg-[#171717] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-white text-2xl font-bold">
                  {stats.successRate ? `${stats.successRate}%` : "N/A"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#202020] rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Recent Transactions
          </h2>

          {transactionsLoading && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          )}

          {transactionsError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-1">Failed to load transactions</p>
              <p className="text-red-400/80 text-sm">
                {transactionsError.message || "Could not connect to backend server"}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Make sure your backend is running at {backendUrl}
              </p>
              <button
                onClick={() => mutateTransactions()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {transactions && transactions.length === 0 && (
            <p className="text-gray-400">No transactions yet</p>
          )}

          {transactions && transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 py-2">ID</th>
                    <th className="text-left text-gray-400 py-2">Network</th>
                    <th className="text-left text-gray-400 py-2">Amount</th>
                    <th className="text-left text-gray-400 py-2">Status</th>
                    <th className="text-left text-gray-400 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, index: number) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="text-white py-3">
                        {tx.id?.slice(0, 8)}...
                      </td>
                      <td className="text-white py-3">{tx.network}</td>
                      <td className="text-white py-3">{tx.amount || "N/A"}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            tx.status === "success"
                              ? "bg-green-600 text-white"
                              : tx.status === "pending"
                              ? "bg-yellow-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="text-gray-400 py-3">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
