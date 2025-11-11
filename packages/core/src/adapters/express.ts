import type { Request, Response, Router } from "express";
import type { Facilitator } from "../facilitator";

/**
 * Creates an Express router with X402 facilitator endpoints mounted.
 *
 * Mounts the following endpoints:
 * - GET /supported - Lists supported payment kinds
 * - GET /public-keys - Returns facilitator's public keys
 * - POST /verify - Verifies a payment authorization
 * - POST /settle - Settles a payment on-chain
 * - GET /dashboard - Returns dashboard statistics
 * - GET /dashboard/transactions - Returns transaction history
 * - GET /balance - Gets USDC balance of facilitator wallet
 *
 * @param facilitator The Facilitator instance to use
 * @param router The Express router to mount the endpoints on
 * @param basePath Optional base path to mount the endpoints (default: "/")
 *
 * @example
 * import express from "express";
 * import { Facilitator, createExpressAdapter } from "@x402-teller/core";
 * import { baseSepolia } from "viem/chains";
 *
 * const app = express();
 * app.use(express.json());
 *
 * const facilitator = new Facilitator({
 *   evmPrivateKey: process.env.EVM_PRIVATE_KEY!,
 *   networks: [baseSepolia],
 * });
 *
 * // Mount at root
 * createExpressAdapter(facilitator, app);
 *
 * // Or mount at a custom path
 * createExpressAdapter(facilitator, app, "/facilitator");
 */
export function createExpressAdapter(
  facilitator: Facilitator,
  router: Router,
  basePath: string = ""
): void {
  const normalizePath = (path: string) => {
    const normalized = basePath + path;
    return normalized || "/";
  };

  router.get(
    normalizePath("/supported"),
    async (req: Request, res: Response) => {
      try {
        const response = await facilitator.handleRequest({
          method: "GET",
          path: "/supported",
        });
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.get(
    normalizePath("/public-keys"),
    async (req: Request, res: Response) => {
      try {
        const response = await facilitator.handleRequest({
          method: "GET",
          path: "/public-keys",
        });
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.post(normalizePath("/verify"), async (req: Request, res: Response) => {
    try {
      const response = await facilitator.handleRequest({
        method: "POST",
        path: "/verify",
        body: req.body,
      });
      res.status(response.status).json(response.body);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.post(normalizePath("/settle"), async (req: Request, res: Response) => {
    try {
      const response = await facilitator.handleRequest({
        method: "POST",
        path: "/settle",
        body: req.body,
      });
      res.status(response.status).json(response.body);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.get(
    normalizePath("/dashboard"),
    async (req: Request, res: Response) => {
      try {
        const response = await facilitator.handleRequest({
          method: "GET",
          path: "/dashboard",
        });
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.get(
    normalizePath("/dashboard/transactions"),
    async (req: Request, res: Response) => {
      try {
        // Build query string from request query parameters
        const queryString = new URLSearchParams(req.query as any).toString();
        const path = queryString
          ? `/dashboard/transactions?${queryString}`
          : "/dashboard/transactions";

        const response = await facilitator.handleRequest({
          method: "GET",
          path,
        });
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.get(
    normalizePath("/dashboard/endpoints"),
    async (req: Request, res: Response) => {
      try {
        const response = await facilitator.handleRequest({
          method: "GET",
          path: "/dashboard/endpoints",
        });
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.get(normalizePath("/balance"), async (req: Request, res: Response) => {
    try {
      // Build query string from request query parameters
      const queryString = new URLSearchParams(req.query as any).toString();
      const path = queryString ? `/balance?${queryString}` : "/balance";

      const response = await facilitator.handleRequest({
        method: "GET",
        path,
      });
      res.status(response.status).json(response.body);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
