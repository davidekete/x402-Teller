"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { type Transaction } from "../../../lib/api";
import { formatDateRange } from "little-date";
import { ChevronDownIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  settled: {
    icon: CheckCircle2,
    label: "Settled",
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

export function PaymentsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const id = useId();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("all");

  const [range, setRange] = useState<DateRange | undefined>(undefined);

  // Filter transactions by selected status and date range
  const filteredTransactions = transactions.filter((tx) => {
    // Status filter
    if (selectedStatus !== "all" && tx.status !== selectedStatus) return false;

    // Date range filter - only apply if BOTH start and end dates are selected AND they are different
    if (range?.from && range?.to) {
      const startDate = new Date(range.from);
      const endDate = new Date(range.to);

      // Skip filtering if start and end dates are the same
      if (startDate.toDateString() === endDate.toDateString()) return true;

      const txDate = new Date(tx.time);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (txDate < startDate || txDate > endDate) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPayments = filteredTransactions.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="basis-3/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <h3 className="text-2xl font-bold">Payments</h3>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Status Filter Dropdown */}
          <div className="w-full max-w-xs space-y-2">
            <Select
              defaultValue="all"
              onValueChange={(value) => handleStatusChange(value)}
            >
              <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  All statuses
                </SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Date Range Picker */}
          {range?.from &&
          range?.to &&
          range.from.toDateString() !== range.to.toDateString() ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs font-medium">
              <span className="text-zinc-300 whitespace-nowrap">
                {formatDateRange(range.from, range.to || new Date(), {
                  includeTime: false,
                })}
              </span>
              <button
                onClick={() => {
                  setRange(undefined);
                  setCurrentPage(0);
                }}
                className="ml-1 hover:text-zinc-100 text-zinc-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-fit max-w-xs">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="dates"
                    className="w-full justify-between font-normal"
                  >
                    Pick a date
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(newRange) => {
                      // Only allow end date if start date is already selected
                      if (!range?.from && newRange?.to && !newRange?.from) {
                        // Reject: trying to select end date without start date
                        return;
                      }
                      setRange(newRange);
                      setCurrentPage(0);
                    }}
                    disabled={(date) => {
                      // Disable dates after today
                      return date > new Date();
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

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
                  Tx Hash
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
              {paginatedPayments.map((payment, index) => {
                const statusInfo =
                  statusConfig[payment.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;

                return (
                  <tr
                    key={index}
                    className="border-b border-zinc-800/30 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                      {payment.client}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                      {payment.txID}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-medium ${
                        payment.status === "settled"
                          ? "text-emerald-500"
                          : payment.status === "failed"
                          ? "text-red-500"
                          : "text-white"
                      }`}
                    >
                      {payment.status === "settled" ? "+ " : ""}$
                      {Number(payment.amount).toFixed(2)}
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
                      {payment.time.split("T")[0]}
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
          {paginatedPayments.map((payment, index) => {
            const statusInfo =
              statusConfig[payment.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={index}
                className="flex border-b border-zinc-800/30 last:border-0"
              >
                <div
                  className={`text-sm font-medium ${
                    payment.status === "settled"
                      ? "text-emerald-500"
                      : payment.status === "failed"
                      ? "text-red-500"
                      : "text-white"
                  }`}
                >
                  {payment.status === "settled" ? "+ " : ""}$
                  {Number(payment.amount).toFixed(2)}
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
                    {payment.time.split("T")[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/20">
          <div className="text-sm text-zinc-400">
            Page {currentPage + 1} of {totalPages || 1} (
            {filteredTransactions.length}{" "}
            {selectedStatus ? `${selectedStatus}` : "total"})
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="bg-zinc-800/50 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2 text-zinc-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className="bg-zinc-800/50 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2 text-zinc-200"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
