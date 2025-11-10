import { Transaction, OffRampTx } from "../db/models/transaction.model";
import type { Model } from "sequelize";

/**
 * Validates if a string is a valid Solana address (base58, 32-44 chars)
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validates if a string is a valid EVM address (0x + 40 hex chars)
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Creates a new transaction record
 */
export async function createTransaction(params: {
  client: string;
  txHash: string;
  amount: number;
  endpoint: string;
  network?: string;
  status?: "pending" | "verified" | "settled" | "failed";
}): Promise<Model> {
  try {
    const { client, txHash, amount, endpoint, status = "pending" } = params;

    // Validate client address (basic validation)
    if (!isValidSolanaAddress(client) && !isValidEvmAddress(client)) {
      throw new Error(`Invalid wallet address format: ${client}`);
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be positive.`);
    }

    const tx = await Transaction.create({
      client,
      txHash,
      amount,
      endpoint,
      status,
      time: new Date(),
    });

    return tx;
  } catch (err: any) {
    console.error("Error creating transaction:", err);
    throw new Error(`Failed to create transaction: ${err.message}`);
  }
}

/**
 * Updates the status of a transaction
 */
export async function updateTransactionStatus(
  txHash: string,
  status: "pending" | "verified" | "settled" | "failed"
): Promise<boolean> {
  try {
    const [affectedCount] = await Transaction.update(
      { status },
      { where: { txHash } }
    );

    if (affectedCount === 0) {
      console.warn(`No transaction found with hash: ${txHash}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Error updating transaction status:", err);
    throw new Error(`Failed to update transaction status: ${err.message}`);
  }
}

/**
 * Gets all transactions for a specific client (wallet address)
 */
export async function getTransactionsByClient(
  client: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: "pending" | "verified" | "settled" | "failed";
  }
): Promise<Model[]> {
  try {
    const where: any = { client };
    if (options?.status) {
      where.status = options.status;
    }

    const transactions = await Transaction.findAll({
      where,
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      order: [["time", "DESC"]],
    });

    return transactions;
  } catch (err: any) {
    console.error("Error fetching transactions by client:", err);
    throw new Error(`Failed to fetch transactions: ${err.message}`);
  }
}

/**
 * Gets all transactions for a specific endpoint
 */
export async function getTransactionsByEndpoint(
  endpoint: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Model[]> {
  try {
    const transactions = await Transaction.findAll({
      where: { endpoint },
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      order: [["time", "DESC"]],
    });

    return transactions;
  } catch (err: any) {
    console.error("Error fetching transactions by endpoint:", err);
    throw new Error(`Failed to fetch transactions: ${err.message}`);
  }
}

/**
 * Gets all transactions with optional filtering
 */
export async function getAllTransactions(options?: {
  limit?: number;
  offset?: number;
  status?: "pending" | "verified" | "settled" | "failed";
}): Promise<Model[]> {
  try {
    const where: any = {};
    if (options?.status) {
      where.status = options.status;
    }

    const transactions = await Transaction.findAll({
      where,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      order: [["time", "DESC"]],
    });

    return transactions;
  } catch (err: any) {
    console.error("Error fetching all transactions:", err);
    throw new Error(`Failed to fetch transactions: ${err.message}`);
  }
}

/**
 * Gets statistics for each endpoint
 * @param timeframe - Optional timeframe for filtering (e.g. '24h', '7d', '30d', 'all')
 * @returns Array of endpoint statistics with call counts
 */
export async function getEndpointStats(timeframe?: string): Promise<
  Array<{
    endpointPath: string;
    numberOfCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalRevenue: number;
    averageAmount: number;
    lastAccessed: Date | null;
  }>
> {
  try {
    // Calculate timeframe filter
    const where: any = {};
    if (timeframe && timeframe !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      where.time = { $gte: startDate };
    }

    // Get all transactions within timeframe
    const transactions = await Transaction.findAll({
      where,
      attributes: ["endpoint", "status", "amount", "time"],
    });

    // Group by endpoint
    const endpointMap = new Map<
      string,
      {
        total: number;
        successful: number;
        failed: number;
        revenue: number;
        amounts: number[];
        lastAccessed: Date | null;
      }
    >();

    for (const tx of transactions) {
      const txData = tx.get({ plain: true }) as any;
      const endpoint = txData.endpoint;

      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, {
          total: 0,
          successful: 0,
          failed: 0,
          revenue: 0,
          amounts: [],
          lastAccessed: null,
        });
      }

      const stats = endpointMap.get(endpoint)!;
      stats.total++;

      if (txData.status === "settled") {
        stats.successful++;
        stats.revenue += txData.amount || 0;
        stats.amounts.push(txData.amount || 0);
      } else if (txData.status === "failed") {
        stats.failed++;
      }

      // Update last accessed time
      const txTime = new Date(txData.time);
      if (!stats.lastAccessed || txTime > stats.lastAccessed) {
        stats.lastAccessed = txTime;
      }
    }

    // Convert map to array and calculate averages
    const result = Array.from(endpointMap.entries()).map(([path, stats]) => ({
      endpointPath: path,
      numberOfCalls: stats.total,
      successfulCalls: stats.successful,
      failedCalls: stats.failed,
      totalRevenue: stats.revenue,
      averageAmount:
        stats.amounts.length > 0
          ? stats.amounts.reduce((a, b) => a + b, 0) / stats.amounts.length
          : 0,
      lastAccessed: stats.lastAccessed,
    }));

    // Sort by number of calls (descending)
    return result.sort((a, b) => b.numberOfCalls - a.numberOfCalls);
  } catch (err: any) {
    console.error("Error fetching endpoint stats:", err);
    throw new Error(`Failed to fetch endpoint stats: ${err.message}`);
  }
}

/**
 * Gets dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  totalTransactions: number;
  pendingTransactions: number;
  verifiedTransactions: number;
  settledTransactions: number;
  failedTransactions: number;
  totalVolume: number;
  uniqueClients: number;
}> {
  try {
    const [
      totalTransactions,
      pendingCount,
      verifiedCount,
      settledCount,
      failedCount,
    ] = await Promise.all([
      Transaction.count(),
      Transaction.count({ where: { status: "pending" } }),
      Transaction.count({ where: { status: "verified" } }),
      Transaction.count({ where: { status: "settled" } }),
      Transaction.count({ where: { status: "failed" } }),
    ]);

    // Get total volume (sum of all settled transactions)
    const settledTxs = await Transaction.findAll({
      where: { status: "settled" },
      attributes: ["amount"],
    });

    const totalVolume = settledTxs.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );

    // Get unique clients count
    const allTxs = await Transaction.findAll({
      attributes: ["client"],
    });

    const uniqueClients = new Set(allTxs.map((tx: any) => tx.client)).size;

    return {
      totalTransactions,
      pendingTransactions: pendingCount,
      verifiedTransactions: verifiedCount,
      settledTransactions: settledCount,
      failedTransactions: failedCount,
      totalVolume,
      uniqueClients,
    };
  } catch (err: any) {
    console.error("Error fetching dashboard stats:", err);
    throw new Error(`Failed to fetch dashboard stats: ${err.message}`);
  }
}
