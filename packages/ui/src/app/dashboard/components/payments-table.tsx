"use client";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { fetchTransactions, type Transaction } from "../../../lib/api";

const defaultPayments: Transaction[] = [
  {
    wallet: "8jUToW...x92pE",
    paymentId: "4C4zJ...67aB",
    amount: 18.99,
    status: "paid",
    timestamp: "2025-11-07 16:55:01",
  },
  {
    wallet: "G8bA7...f1e9K",
    paymentId: "G8bA7...f1e9K",
    amount: 4.5,
    status: "pending",
    timestamp: "2025-11-07 16:30:15",
  },
  {
    wallet: "2D3xH...89cNZ",
    paymentId: "2D3xH...89cNZ",
    amount: 88.0,
    status: "paid",
    timestamp: "2025-11-07 15:45:30",
  },
  {
    wallet: "F1eR9...32tYQ",
    paymentId: "F1eR9...32tYQ",
    amount: 15.0,
    status: "failed",
    timestamp: "2025-11-07 14:02:44",
  },
  {
    wallet: "A0cW5...55dLX",
    paymentId: "A0cW5...55dLX",
    amount: 12.5,
    status: "pending",
    timestamp: "2025-11-06 11:20:05",
  },
];

const statusConfig = {
  paid: {
    icon: CheckCircle2,
    label: "Paid",
    className: "text-emerald-500 bg-emerald-500/10",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-orange-500 bg-orange-500/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-red-500 bg-red-500/10",
  },
};

export function PaymentsTable() {
  const { data, error } = useSWR(
    "transactions",
    () => fetchTransactions(20, 0),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const payments = data?.data || defaultPayments;

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">Payments</h3>
      <Card className="bg-[#0f0f0f] border-zinc-800/50 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Wallet
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Payment ID
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Amount (USDC)
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Status
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => {
                const statusInfo =
                  statusConfig[payment.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;

                return (
                  <tr
                    key={index}
                    className="border-b border-zinc-800/30 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-mono">
                      {payment.wallet}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {payment.paymentId}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-medium ${
                        payment.status === "paid"
                          ? "text-emerald-500"
                          : payment.status === "failed"
                          ? "text-red-500"
                          : "text-white"
                      }`}
                    >
                      {payment.status === "paid" ? "+ " : ""}$
                      {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {payment.timestamp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Table */}
        <div className="md:hidden">
          <div className="flex border-b border-zinc-800/50 bg-zinc-900/30">
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Amount (USDC)
            </div>
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Status
            </div>
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Time
            </div>
          </div>
          {payments.map((payment, index) => {
            const statusInfo =
              statusConfig[payment.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={index}
                className="flex border-b border-zinc-800/30 last:border-0"
              >
                <div className="flex-1 px-4 py-4">
                  <div className="text-sm font-mono mb-1">{payment.wallet}</div>
                  <div
                    className={`text-sm font-medium ${
                      payment.status === "paid"
                        ? "text-emerald-500"
                        : payment.status === "failed"
                        ? "text-red-500"
                        : "text-white"
                    }`}
                  >
                    {payment.status === "paid" ? "+ " : ""}$
                    {payment.amount.toFixed(2)}
                  </div>
                </div>
                <div className="flex-1 px-4 py-4 flex items-center">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </div>
                </div>
                <div className="flex-1 px-4 py-4 flex items-center">
                  <div className="text-xs text-zinc-400">
                    {payment.timestamp.split(" ")[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
