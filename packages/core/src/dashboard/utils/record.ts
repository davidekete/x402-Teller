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
      limit: options?.limit || 100,
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
