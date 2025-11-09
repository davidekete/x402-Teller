import type { Chain } from "viem";
import { toX402Network, isSolanaNetwork } from "./utils";
import { privateKeyToAccount } from "viem/accounts";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";

import {
  createConnectedClient,
  createSigner,
  SupportedEVMNetworks,
  SupportedSVMNetworks,
} from "x402/types";

import type {
  PaymentPayload as X402PaymentPayload,
  PaymentRequirements as X402PaymentRequirements,
  VerifyResponse as X402VerifyResponse,
  SettleResponse as X402SettleResponse,
  RoutesConfig,
} from "x402/types";

// Dashboard imports (optional)
import {
  createTransaction,
  getAllTransactions,
  getDashboardStats,
  updateTransactionStatus,
  getEndpointStats,
} from "./dashboard/utils/record";
import { initializeDashboard } from "./dashboard";

export interface SettleResult {
  success: boolean;
  errorReason?: string;
  transaction: string;
  network: string;
  payer?: string;
}

export interface PaymentPayload {
  [key: string]: any;
}

export interface PaymentRequirements {
  network: string; // e.g. "base-sepolia"
  [key: string]: any;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
}

export type SolanaNetwork = "solana" | "solana-devnet";

export interface CreateFacilitatorOptions {
  evmPrivateKey?: string;
  solanaPrivateKey?: string;
  solanaFeePayer?: string; // Solana public address for fee payer
  networks: (Chain | SolanaNetwork)[];
  minConfirmations?: number;
  enableDashboard?: boolean; // Enable transaction tracking to database
  dashboardOptions?: {
    force?: boolean; // If true, drops existing tables and recreates them (DEVELOPMENT ONLY)
    autoInit?: boolean; // If true, automatically initializes dashboard on Facilitator creation (default: true)
  };
  payWallRouteConfig?: RoutesConfig;
}

export const DEFAULT_MIN_CONFIRMATIONS = 1;

export interface SupportedKind {
  x402Version: number;
  scheme: "exact";
  network: string;
  extra?: Record<string, any>;
}

export interface SupportedResponse {
  kinds: SupportedKind[];
}

export interface HttpResponse {
  status: number;
  body: any;
}

export interface HttpRequest {
  method: string;
  path: string;
  body?: any;
}

export class Facilitator {
  private readonly evmPrivateKey?: string;
  private readonly solanaPrivateKey?: string;
  private readonly solanaFeePayer?: string;
  private readonly networks: (Chain | SolanaNetwork)[];
  private readonly minConfirmations: number;
  private readonly enableDashboard: boolean;
  private readonly payWallRoutes?: RoutesConfig;
  private dashboardReady: Promise<void> | null = null;

  // Public keys derived from private keys
  public evmPublicKey?: string;
  public solanaPublicKey?: string;

  constructor(options: CreateFacilitatorOptions) {
    if (!options.evmPrivateKey && !options.solanaPrivateKey) {
      throw new Error(
        "Facilitator: at least one private key (evmPrivateKey or solanaPrivateKey) is required"
      );
    }
    if (!options.networks || options.networks.length === 0) {
      throw new Error("Facilitator: at least one network is required");
    }

    // Validate that if Solana networks are configured, we have a fee payer
    const hasSolanaNetworks = options.networks.some(
      (net) =>
        typeof net === "string" && (net === "solana" || net === "solana-devnet")
    );
    if (hasSolanaNetworks && !options.solanaFeePayer) {
      throw new Error(
        "Facilitator: solanaFeePayer is required when using Solana networks"
      );
    }

    this.evmPrivateKey = options.evmPrivateKey;
    this.solanaPrivateKey = options.solanaPrivateKey;
    this.solanaFeePayer = options.solanaFeePayer;
    this.networks = options.networks;
    this.minConfirmations =
      options.minConfirmations ?? DEFAULT_MIN_CONFIRMATIONS;
    this.enableDashboard = options.enableDashboard ?? false;
    this.payWallRoutes = options.payWallRouteConfig;

    // Validate that if dashboard is enabled, paywall routes must be provided
    if (this.enableDashboard && !this.payWallRoutes) {
      throw new Error(
        "Facilitator: payWallRouteConfig is required when enableDashboard is true. "
      );
    }

    // Derive and store public keys from private keys
    if (this.evmPrivateKey) {
      this.evmPublicKey = this.deriveEvmPublicKey(this.evmPrivateKey);
    }
    if (this.solanaPrivateKey) {
      this.solanaPublicKey = this.deriveSolanaPublicKey(this.solanaPrivateKey);
    }

    // Auto-initialize dashboard if enabled and autoInit is true (default)
    const autoInit = options.dashboardOptions?.autoInit ?? true;
    if (this.enableDashboard && autoInit) {
      const force = options.dashboardOptions?.force ?? false;
      this.dashboardReady = this.initDashboard(force);
    }
  }

  /**
   * Derives the EVM public address from a private key
   * @private
   */
  private deriveEvmPublicKey(privateKey: string): string {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return account.address;
  }

  /**
   * Derives the Solana public key from a private key
   * @private
   */
  private deriveSolanaPublicKey(privateKey: string): string {
    // Decode the base58 private key to bytes
    const secretKey = bs58.decode(privateKey);

    // Create a keypair from the secret key
    const keypair = Keypair.fromSecretKey(secretKey);

    // Return the public key as a base58 string
    return keypair.publicKey.toBase58();
  }

  /**
   * Initializes the dashboard database
   * @private
   */
  private async initDashboard(force: boolean): Promise<void> {
    try {
      await initializeDashboard({ force });
      console.log("✅ Dashboard initialized");
    } catch (error) {
      console.error("❌ Failed to initialize dashboard:", error);
      console.log("⚠️  Continuing without dashboard...");
      // Set to resolved promise so subsequent calls don't fail
      this.dashboardReady = Promise.resolve();
    }
  }

  /**
   * Returns all configured paywall routes/endpoints with usage statistics
   *
   * @param timeframe - Optional timeframe for filtering statistics (e.g. '24h', '7d', '30d', 'all')
   * @returns Object containing array of paywall endpoints with their configuration and usage stats
   */
  public async getPaywallEndpoints(timeframe: string = "all") {
    if (!this.payWallRoutes) {
      return {
        endpoints: [],
        message: "No paywall routes configured",
      };
    }

    // Get usage statistics from database
    let usageStats: Awaited<ReturnType<typeof getEndpointStats>> = [];
    try {
      await this.ensureDashboardReady();
      usageStats = await getEndpointStats(timeframe);
    } catch (error) {
      console.error("Error fetching endpoint stats:", error);
      // Continue with empty stats if dashboard is not available
    }

    // Create a map of endpoint stats for quick lookup
    const statsMap = new Map(
      usageStats.map((stat) => [stat.endpointPath, stat])
    );

    // Merge static configuration with usage statistics
    const endpoints = Object.entries(this.payWallRoutes).map(
      ([path, config]) => {
        // Type guard: check if config is a RouteConfig object (has price and network properties)
        const isRouteConfig =
          typeof config === 'object' &&
          config !== null &&
          'price' in config &&
          'network' in config;

        // Get usage stats for this endpoint (if available)
        const stats = statsMap.get(path);

        // Build endpoint object with config and stats
        const endpoint: any = {
          endpointPath: path,
          // Usage statistics (default to 0 if no data)
          numberOfCalls: stats?.numberOfCalls || 0,
          successfulCalls: stats?.successfulCalls || 0,
          failedCalls: stats?.failedCalls || 0,
          totalRevenue: stats?.totalRevenue || 0,
          averageAmount: stats?.averageAmount || 0,
          lastAccessed: stats?.lastAccessed || null,
        };

        // Add static configuration
        if (isRouteConfig) {
          endpoint.price = config.price;
          endpoint.network = config.network;
          endpoint.description = config.config?.description || "";
        } else {
          // Handle primitive types (string, number) or token amounts
          endpoint.price = String(config);
          endpoint.network = "unknown";
          endpoint.description = "";
        }

        return endpoint;
      }
    );

    // Sort by number of calls (descending)
    endpoints.sort((a, b) => b.numberOfCalls - a.numberOfCalls);

    return {
      endpoints,
      totalCount: endpoints.length,
    };
  }

  /**
   * Ensures the dashboard is ready before tracking transactions
   * @private
   */
  private async ensureDashboardReady(): Promise<void> {
    if (this.dashboardReady) {
      await this.dashboardReady;
    }
  }

  /**
   * Returns the list of payment "kinds" this facilitator supports.
   *
   * @returns Object with array of supported payment kinds
   */
  public listSupportedKinds(): SupportedResponse {
    const kinds: SupportedKind[] = this.networks.map((network) => {
      const networkName = toX402Network(network);
      const isSolana = isSolanaNetwork(network);

      const kind: SupportedKind = {
        x402Version: 1,
        scheme: "exact",
        network: networkName,
      };

      // Add fee payer for Solana networks
      if (isSolana && this.solanaFeePayer) {
        kind.extra = {
          feePayer: this.solanaFeePayer,
        };
      }

      return kind;
    });

    return { kinds };
  }

  /**
   * Verifies a payment authorization without settling it on-chain.
   *
   * Checks the signature and payment details are valid according to the
   * payment requirements.
   *
   * @param paymentPayload The signed payment authorization
   * @param paymentRequirements The expected payment details
   * @returns Verification result with validity and payer address
   */
  public async verifyPayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<VerifyResult> {
    const requestedNetwork = paymentRequirements.network;

    const locallySupported = this.networks.some(
      (network) => toX402Network(network) === requestedNetwork
    );
    if (!locallySupported) {
      return { isValid: false };
    }

    // Check if network is supported by x402
    const isEVM = SupportedEVMNetworks.includes(requestedNetwork as any);
    const isSVM = SupportedSVMNetworks.includes(requestedNetwork as any);

    if (!isEVM && !isSVM) {
      return { isValid: false };
    }

    // For Solana, verification requires a signer (to simulate the transaction)
    // For EVM, we can use just a client (read-only operations)
    let clientOrSigner;
    if (isSVM) {
      if (!this.solanaPrivateKey) {
        return { isValid: false };
      }
      clientOrSigner = await createSigner(
        requestedNetwork,
        this.solanaPrivateKey
      );
    } else {
      clientOrSigner = createConnectedClient(requestedNetwork);
    }

    const resp: X402VerifyResponse = await x402Verify(
      clientOrSigner,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    if (!resp.isValid) {
      throw Error("Invalid payment");
    }

    // Track verification in dashboard if enabled
    if (this.enableDashboard && resp.payer) {
      console.log(paymentPayload);
      try {
        // Ensure dashboard is ready before tracking
        await this.ensureDashboardReady();

        // Extract transaction hash from payload
        const txHash =
          (paymentPayload as any).txHash ||
          (paymentPayload as any).signature ||
          `verify-${Date.now()}-${resp.payer}`;

        await createTransaction({
          client: resp.payer,
          txHash,
          amount: parseInt(paymentRequirements.maxAmountRequired || "0"),
          endpoint: paymentRequirements.resource || "unknown",
          network: requestedNetwork,
          status: "verified",
        });
      } catch (dashboardError) {
        // Don't fail the payment if dashboard tracking fails
        console.error(
          "Failed to track verification in dashboard:",
          dashboardError
        );
      }
    }

    return {
      isValid: resp.isValid,
      payer: resp.payer,
    };
  }

  /**
   * Settles a payment by broadcasting the transaction to the blockchain.
   *
   * Creates a transaction from the payment authorization and broadcasts it
   * to the appropriate network.
   *
   * @param paymentPayload The signed payment authorization
   * @param paymentRequirements The expected payment details
   * @returns Settlement result with transaction hash and status
   */
  public async settlePayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<SettleResult> {
    const requestedNetwork = paymentRequirements.network;

    const locallySupported = this.networks.some(
      (network) => toX402Network(network) === requestedNetwork
    );
    if (!locallySupported) {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
      };
    }

    // Check if network is supported by x402
    const isEVM = SupportedEVMNetworks.includes(requestedNetwork as any);
    const isSVM = SupportedSVMNetworks.includes(requestedNetwork as any);

    if (!isEVM && !isSVM) {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
      };
    }

    // Determine which private key to use
    let privateKey: string;
    if (isSVM) {
      if (!this.solanaPrivateKey) {
        return {
          success: false,
          transaction: "",
          network: requestedNetwork,
          errorReason: "Solana private key not configured",
        };
      }
      privateKey = this.solanaPrivateKey;
    } else {
      if (!this.evmPrivateKey) {
        return {
          success: false,
          transaction: "",
          network: requestedNetwork,
          errorReason: "EVM private key not configured",
        };
      }
      privateKey = this.evmPrivateKey;
    }

    const signer = await createSigner(requestedNetwork, privateKey);

    const resp: X402SettleResponse = await x402Settle(
      signer,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    // Track settlement in dashboard if enabled
    if (this.enableDashboard) {
      try {
        // Ensure dashboard is ready before tracking
        await this.ensureDashboardReady();

        const txHash = resp.transaction;
        const status = resp.success ? "settled" : "failed";

        if (resp.payer && txHash) {
          // Try to update existing transaction first
          const updated = await updateTransactionStatus(txHash, status);

          // If no existing transaction, create a new one
          if (!updated) {
            await createTransaction({
              client: resp.payer,
              txHash,
              amount: parseInt(paymentRequirements.maxAmountRequired || "0"),
              endpoint: paymentRequirements.resource || "unknown",
              network: requestedNetwork,
              status,
            });
          }
        }
      } catch (dashboardError) {
        // Don't fail the payment if dashboard tracking fails
        console.error(
          "Failed to track settlement in dashboard:",
          dashboardError
        );
      }
    }

    return {
      success: resp.success,
      errorReason: resp.errorReason,
      transaction: resp.transaction,
      network: resp.network,
      payer: resp.payer,
    };
  }

  /**
   * handleRequest()
   *
   * Framework-agnostic HTTP request handler for facilitator endpoints.
   * Handles GET /supported, GET /public-keys, POST /verify, POST /settle,
   * GET /dashboard, and GET /dashboard/transactions.
   *
   * Returns a standard { status, body } response that can be used with any framework.
   *
   * @example
   * // Hono
   * app.all("/facilitator/*", async (c) => {
   *   const response = await facilitator.handleRequest({
   *     method: c.req.method,
   *     path: c.req.path.replace("/facilitator", ""),
   *     body: await c.req.json().catch(() => undefined)
   *   });
   *   return c.json(response.body, response.status);
   * });
   *
   * @example
   * // Express
   * app.all("/facilitator/*", async (req, res) => {
   *   const response = await facilitator.handleRequest({
   *     method: req.method,
   *     path: req.path.replace("/facilitator", ""),
   *     body: req.body
   *   });
   *   res.status(response.status).json(response.body);
   * });
   */
  public async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const { method, path, body } = request;

    // GET /supported
    if (method === "GET" && path === "/supported") {
      return {
        status: 200,
        body: this.listSupportedKinds(),
      };
    }

    // GET /public-keys
    if (method === "GET" && path === "/public-keys") {
      return {
        status: 200,
        body: {
          evmPublicKey: this.evmPublicKey,
          solanaPublicKey: this.solanaPublicKey,
        },
      };
    }

    // POST /verify
    if (method === "POST" && path === "/verify") {
      try {
        if (!body?.paymentPayload || !body?.paymentRequirements) {
          return {
            status: 400,
            body: { error: "Missing paymentPayload or paymentRequirements" },
          };
        }

        const result = await this.verifyPayment(
          body.paymentPayload,
          body.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        return {
          status: 400,
          body: {
            error: "Failed to verify payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    // POST /settle
    if (method === "POST" && path === "/settle") {
      try {
        if (!body?.paymentPayload || !body?.paymentRequirements) {
          return {
            status: 400,
            body: { error: "Missing paymentPayload or paymentRequirements" },
          };
        }

        const result = await this.settlePayment(
          body.paymentPayload,
          body.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        return {
          status: 400,
          body: {
            error: "Failed to settle payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    //Get /dashboard
    if (method === "GET" && path === "/dashboard") {
      try {
        const stats = await getDashboardStats();
        return {
          status: 200,
          body: stats,
        };
      } catch (error) {
        return {
          status: 500,
          body: {
            error: "Failed to fetch dashboard stats",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    //GET /dashboard/endpoints
    if (method === "GET" && path.includes("/dashboard/endpoints")) {
      try {
        // Parse query parameters for timeframe
        const url = new URL(path, "http://localhost");
        const timeframe = url.searchParams.get("timeframe") || "all";

        const result = await this.getPaywallEndpoints(timeframe);
        return {
          status: 200,
          body: result,
        };
      } catch (error: any) {
        console.error("Error fetching paywall endpoints:", error);
        return {
          status: 500,
          body: {
            error: "Failed to fetch paywall endpoints",
            message: error.message,
          },
        };
      }
    }

    //Get /dashboard/transactions
    if (method === "GET" && path.includes("/dashboard/transactions")) {
      try {
        const urlParts = path.split("?");
        const searchParams = new URLSearchParams(urlParts[1] || "");

        const limit = parseInt(searchParams.get("limit") || "50") || 50;
        const offset = parseInt(searchParams.get("offset") || "0") || 0;
        const status = searchParams.get("status") as
          | "pending"
          | "verified"
          | "settled"
          | "failed"
          | null;

        const transactions = await getAllTransactions({
          limit,
          offset,
          status: status || undefined,
        });

        return {
          status: 200,
          body: transactions,
        };
      } catch (error) {
        return {
          status: 500,
          body: {
            error: "Failed to fetch transactions",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    // 404 - Not Found
    return {
      status: 404,
      body: { error: "Not found" },
    };
  }
}
