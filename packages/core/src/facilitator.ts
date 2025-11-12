import { toX402Network, isSolanaNetwork } from "./utils";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";

import {
  createSigner,
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
  network: string; // e.g. "solana-devnet"
  [key: string]: any;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
}

export type SolanaNetwork = "solana" | "solana-devnet";

export interface CreateFacilitatorOptions {
  solanaPrivateKey: string;
  solanaFeePayer: string; // Solana public address for fee payer
  networks: SolanaNetwork[];
  minConfirmations?: number;
  payWallRouteConfig: RoutesConfig; // Route configuration for paywall endpoints (required for dashboard)
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
  private readonly solanaPrivateKey: string;
  private readonly solanaFeePayer: string;
  private readonly networks: SolanaNetwork[];
  private readonly minConfirmations: number;
  private readonly payWallRoutes: RoutesConfig;
  private dashboardReady: Promise<void> | null = null;

  // Public key derived from private key
  public solanaPublicKey: string;

  constructor(options: CreateFacilitatorOptions) {
    if (!options.solanaPrivateKey) {
      throw new Error(
        "Facilitator: solanaPrivateKey is required"
      );
    }
    if (!options.solanaFeePayer) {
      throw new Error(
        "Facilitator: solanaFeePayer is required"
      );
    }
    if (!options.networks || options.networks.length === 0) {
      throw new Error("Facilitator: at least one network is required");
    }
    if (!options.payWallRouteConfig) {
      throw new Error("Facilitator: payWallRouteConfig is required");
    }

    this.solanaPrivateKey = options.solanaPrivateKey;
    this.solanaFeePayer = options.solanaFeePayer;
    this.networks = options.networks;
    this.minConfirmations =
      options.minConfirmations ?? DEFAULT_MIN_CONFIRMATIONS;
    this.payWallRoutes = options.payWallRouteConfig;

    // Derive and store public key from private key
    this.solanaPublicKey = this.deriveSolanaPublicKey(this.solanaPrivateKey);

    // Auto-initialize dashboard (creates database tables if they don't exist)
    this.dashboardReady = this.initDashboard(false);
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
          typeof config === "object" &&
          config !== null &&
          "price" in config &&
          "network" in config;

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
    const isSVM = SupportedSVMNetworks.includes(requestedNetwork as any);

    if (!isSVM) {
      return { isValid: false };
    }

    // For Solana, verification requires a signer (to simulate the transaction)
    const clientOrSigner = await createSigner(
      requestedNetwork,
      this.solanaPrivateKey
    );

    const resp: X402VerifyResponse = await x402Verify(
      clientOrSigner,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    if (!resp.isValid) {
      throw Error("Invalid payment");
    }

    // Track verification in dashboard
    if (resp.payer) {
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
    const isSVM = SupportedSVMNetworks.includes(requestedNetwork as any);

    if (!isSVM) {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
        errorReason: "Only Solana networks are supported",
      };
    }

    const signer = await createSigner(requestedNetwork, this.solanaPrivateKey);

    const resp: X402SettleResponse = await x402Settle(
      signer,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    // Track settlement in dashboard
    {
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
   * Gets the USDC balance of the facilitator wallet
   *
   * @param network - The network to check balance on
   * @returns Balance in token base units (e.g., 1000000 = 1 USDC)
   */
  public async getBalance(network: string): Promise<{
    success: boolean;
    balance?: number;
    errorReason?: string;
  }> {
    // Validate network is Solana
    if (network !== "solana" && network !== "solana-devnet") {
      return {
        success: false,
        errorReason: "Balance check only supported on Solana networks",
      };
    }

    // Validate we have Solana private key
    if (!this.solanaPrivateKey) {
      return {
        success: false,
        errorReason: "Solana private key not configured",
      };
    }

    try {
      const { Connection, clusterApiUrl, PublicKey, Keypair } = await import(
        "@solana/web3.js"
      );

      const bs58 = await import("bs58");

      // Setup connection
      const endpoint =
        network === "solana"
          ? clusterApiUrl("mainnet-beta")
          : clusterApiUrl("devnet");
      const connection = new Connection(endpoint, "confirmed");

      // Create keypair from private key
      const secretKey = bs58.default.decode(this.solanaPrivateKey);
      const payerKeypair = Keypair.fromSecretKey(secretKey);

      // USDC mint addresses
      const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const USDC_MINT_MAINNET =
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

      const usdcMint =
        network === "solana" ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;

      // Get USDC balance
      const { getAssociatedTokenAddress, getAccount } = await import(
        "@solana/spl-token"
      );

      const mintPubkey = new PublicKey(usdcMint);
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        payerKeypair.publicKey
      );

      try {
        const account = await getAccount(connection, tokenAccount);
        return {
          success: true,
          balance: Number(account.amount),
        };
      } catch {
        // Token account doesn't exist, balance is 0
        return {
          success: true,
          balance: 0,
        };
      }
    } catch (error) {
      console.error("Balance check error:", error);
      return {
        success: false,
        errorReason:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
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

    // GET /balance
    if (method === "GET" && path.includes("/balance")) {
      try {
        const url = new URL(path, "http://localhost");
        const network = url.searchParams.get("network");

        if (!network) {
          return {
            status: 400,
            body: { error: "Missing required parameter: network" },
          };
        }

        const result = await this.getBalance(network);

        return {
          status: result.success ? 200 : 400,
          body: result,
        };
      } catch (error) {
        return {
          status: 500,
          body: {
            error: "Failed to fetch balance",
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
