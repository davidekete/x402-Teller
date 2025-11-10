"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { fetchEndpointStats, type EndpointStat } from "../../../lib/api";

const defaultEndpoints: EndpointStat[] = [
  {
    method: "POST",
    route: "/api/generate",
    pricePerUnit: "0.05 / call",
    calls24h: "12,450",
    isActive: true,
  },
  {
    method: "GET",
    route: "/api/verify",
    pricePerUnit: "0.01 / unit",
    calls24h: "25,120",
    isActive: true,
  },
  {
    method: "POST",
    route: "/api/ingest",
    pricePerUnit: "0.10 / record",
    calls24h: "450",
    isActive: true,
  },
];

export function EndpointsTable() {
  const [timeframe, setTimeframe] = useState("24h");

  const { data, error } = useSWR(
    `endpoints-${timeframe}`,
    () => fetchEndpointStats(timeframe),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const endpoints = data || defaultEndpoints;
  const activeCount = endpoints.filter((e) => e.isActive).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold">Endpoints</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-500">{activeCount} Active</span>
        </div>
      </div>

      <Card className="bg-[#0f0f0f] border-zinc-800/50 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Method
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Route
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Price/Unit
                </th>
                <th className="text-left text-sm font-medium text-zinc-400 px-6 py-4">
                  Calls (24h)
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr
                  key={index}
                  className="border-b border-zinc-800/30 last:border-0"
                >
                  <td className="px-6 py-4">
                    <span className="inline-block bg-zinc-800/50 text-white px-3 py-1 rounded text-xs font-mono font-medium">
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {endpoint.route}
                  </td>
                  <td className="px-6 py-4 text-sm">{endpoint.pricePerUnit}</td>
                  <td className="px-6 py-4 text-sm">{endpoint.calls24h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Table */}
        <div className="md:hidden">
          <div className="flex border-b border-zinc-800/50 bg-zinc-900/30">
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Method
            </div>
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Route
            </div>
            <div className="flex-1 text-xs font-medium text-zinc-400 px-4 py-3">
              Price/Unit
            </div>
          </div>
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className="flex border-b border-zinc-800/30 last:border-0 items-center"
            >
              <div className="flex-1 px-4 py-4">
                <span className="inline-block bg-zinc-800/50 text-white px-3 py-1 rounded text-xs font-mono font-medium">
                  {endpoint.method}
                </span>
              </div>
              <div className="flex-1 px-4 py-4 text-sm font-mono">
                {endpoint.route}
              </div>
              <div className="flex-1 px-4 py-4 text-sm">
                {endpoint.pricePerUnit}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
