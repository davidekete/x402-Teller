// API configuration and helper functions
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  chartData: Array<{ month: string; revenue: number }>;
}

export interface Transaction {
  wallet: string;
  paymentId: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  timestamp: string;
}

export interface EndpointStat {
  method: string;
  route: string;
  pricePerUnit: string;
  calls24h: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Fetch dashboard statistics
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
}

// Fetch transactions with pagination and filters
export async function fetchTransactions(
  limit = 20,
  offset = 0,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResponse<Transaction>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (filters?.status) {
    params.append("status", filters.status);
  }
  if (filters?.startDate) {
    params.append("startDate", filters.startDate);
  }
  if (filters?.endDate) {
    params.append("endDate", filters.endDate);
  }

  const response = await fetch(
    `${API_BASE_URL}/dashboard/transactions?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
}

// Fetch endpoint statistics
export async function fetchEndpointStats(
  timeframe = "24h"
): Promise<EndpointStat[]> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/endpoints?timeframe=${timeframe}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch endpoint stats");
  }

  return response.json();
}

// Fetch supported payment networks
export async function fetchSupportedNetworks() {
  const response = await fetch(`${API_BASE_URL}/supported`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch supported networks");
  }

  return response.json();
}

// Verify payment authorization
export async function verifyPayment(authData: any) {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authData),
  });

  if (!response.ok) {
    throw new Error("Failed to verify payment");
  }

  return response.json();
}

// Execute payment settlement
export async function settlePayment(settlementData: any) {
  const response = await fetch(`${API_BASE_URL}/settle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settlementData),
  });

  if (!response.ok) {
    throw new Error("Failed to settle payment");
  }

  return response.json();
}
