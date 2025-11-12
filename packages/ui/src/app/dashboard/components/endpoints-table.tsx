"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { fetchEndpointStats, type EndpointStat } from "../../../lib/api";
import { Activity, AlertCircle } from "lucide-react";

const defaultEndpoints: EndpointStat = {
  endpoints: [
    {
      endpointPath: "/api/generate",
      numberOfCalls: 12450,
      successfulCalls: 12300,
      failedCalls: 150,
      totalRevenue: 622.5,
      averageAmount: 0.05,
      lastAccessed: new Date("2025-11-10T08:30:00.000Z"),
      price: "0.05 / call",
      network: "mainnet",
      description: "Generates content from prompts",
    },
    {
      endpointPath: "/api/verify",
      numberOfCalls: 25120,
      successfulCalls: 24900,
      failedCalls: 220,
      totalRevenue: 251.2,
      averageAmount: 0.01,
      lastAccessed: new Date("2025-11-10T09:15:00.000Z"),
      price: "0.01 / unit",
      network: "mainnet",
      description: "Verifies input and returns validation results",
    },
    {
      endpointPath: "/api/ingest",
      numberOfCalls: 450,
      successfulCalls: 445,
      failedCalls: 5,
      totalRevenue: 45.0,
      averageAmount: 0.1,
      lastAccessed: null,
      price: "0.10 / record",
      network: "ingest-net",
      description: "Ingests data records for processing",
    },
  ],
  totalCount: 3,
};

export function EndpointsTable() {
  const [timeframe] = useState("24h");

  const { data, error, isLoading } = useSWR(
    `endpoints-${timeframe}`,
    () => fetchEndpointStats(timeframe),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      onError: (err) => {
        console.error("[v0] Failed to fetch endpoint stats:", err);
      },
    }
  );

  const endpoints = data || defaultEndpoints;
  const activeCount = endpoints.totalCount;
  const hasEndpoints = endpoints.endpoints && endpoints.endpoints.length > 0;

  if (error) {
    return (
      <div className="basis-2/5">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-2xl font-bold">Endpoints</h3>
        </div>

        <Card className="bg-[#0f0f0f] border-zinc-800/50 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              Failed to Load Endpoints
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              {error.message ||
                "An error occurred while loading endpoint data. Please try again later."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="basis-2/5">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-2xl font-bold">Endpoints</h3>
        </div>

        <Card className="bg-[#0f0f0f] border-zinc-800/50 p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-400">Loading endpoints...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="basis-2/5">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-2xl font-bold">Endpoints</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-500">{activeCount} Active</span>
        </div>
      </div>

      <Card className="bg-[#0f0f0f] border-zinc-800/50 overflow-hidden">
        {!hasEndpoints ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Activity className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              No Endpoints Configured
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Set up your API endpoints to start tracking calls and revenue
              metrics.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                      Route
                    </th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                      Price/Unit
                    </th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                      Calls
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.endpoints.map((endpoint, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-800/30 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                        {endpoint.endpointPath}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {endpoint.price}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {endpoint.numberOfCalls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Table */}
            <div className="md:hidden">
              <div className="flex border-b border-zinc-800/50 bg-zinc-900/30">
                <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
                  Route
                </div>
                <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
                  Price/Unit
                </div>
              </div>
              {endpoints.endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex border-b border-zinc-800/30 last:border-0 items-center"
                >
                  <div className="flex-1 px-4 py-4 text-sm font-mono">
                    {endpoint.endpointPath}
                  </div>
                  <div className="flex-1 px-4 py-4 text-sm">
                    {endpoint.price}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
