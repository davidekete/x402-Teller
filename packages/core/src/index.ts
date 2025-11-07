export { Facilitator, DEFAULT_MIN_CONFIRMATIONS } from "./facilitator";
export type {
  CreateFacilitatorOptions,
  PaymentPayload,
  PaymentRequirements,
  VerifyResult,
  SettleResult,
  SupportedKind,
  SupportedResponse,
  HttpRequest,
  HttpResponse
} from "./facilitator";

// Framework adapters
export { createHonoAdapter } from "./adapters/hono";
export { createExpressAdapter } from "./adapters/express";

// Dashboard exports
export { initializeDashboard } from "./dashboard/index";
export { connectToDB, closeDatabaseConnection } from "./dashboard/db/index";
export { syncModels, Transaction, OffRampTx } from "./dashboard/db/models/transaction.model";
export {
  createTransaction,
  updateTransactionStatus,
  getTransactionsByClient,
  getTransactionsByEndpoint,
  getAllTransactions,
  getDashboardStats,
  isValidSolanaAddress,
  isValidEvmAddress,
} from "./dashboard/utils/record";
