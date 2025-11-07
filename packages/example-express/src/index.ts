import express from "express";
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import { Facilitator, createExpressAdapter } from "@x402-sovereign/core";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

// Validate environment variables
const solanaPrivateKey = process.env.SVM_PRIVATE_KEY?.trim();
if (!solanaPrivateKey) {
  console.error(
    "❌ Error: SVM_PRIVATE_KEY environment variable is not set or is empty"
  );
  console.error(
    "Please create a .env file with: SVM_PRIVATE_KEY=your_base58_private_key"
  );
  process.exit(1);
}

const app = express();

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static("public"));

// Initialize your sovereign facilitator
// const facilitator = new Facilitator({
//   evmPrivateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
//   networks: [baseSepolia],
// });

const facilitator = new Facilitator({
  solanaPrivateKey,
  solanaFeePayer: "4XSRdDViZH2CPjLqF3M4eDmE1UPHfsjg49m86PMNdZAw", // Your Solana public address
  networks: ["solana-devnet"],
  enableDashboard: true, // Enable transaction tracking
  dashboardOptions: {
    force: true, // Reset database on startup (DEVELOPMENT ONLY)
    autoInit: true, // Auto-initialize dashboard (default: true)
  },
});

// Add facilitator endpoints using the Express adapter
// This mounts GET /facilitator/supported, POST /facilitator/verify, POST /facilitator/settle
createExpressAdapter(facilitator, app, "/facilitator");

// Load custom Solana paywall HTML template
const solanaPaywallTemplate = readFileSync(
  join(__dirname, "..", "public", "solana-paywall.html"),
  "utf-8"
);

// Custom middleware to intercept 402 responses and inject payment requirements
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    // Check if this is a 402 response with HTML
    if (
      res.statusCode === 402 &&
      typeof data === "string" &&
      data.includes("<!DOCTYPE html>")
    ) {
      // Check if this is NOT our custom Solana paywall (it's the default Base paywall)
      if (!data.includes("Phantom Wallet")) {
        // This is the default Base paywall, replace it with our Solana paywall
        try {
          // Extract payment requirements from the response
          // The x402-express middleware includes them in a script tag or meta tag
          const paymentReqMatch = data.match(
            /window\.__PAYMENT_REQUIREMENTS__\s*=\s*({[^}]+})/
          );

          if (paymentReqMatch) {
            const paymentRequirements = paymentReqMatch[1];
            const customHtml = solanaPaywallTemplate.replace(
              "'__PAYMENT_REQUIREMENTS__'",
              paymentRequirements
            );
            return originalSend.call(this, customHtml);
          }
        } catch (error) {
          console.error("Error injecting payment requirements:", error);
        }

        // Fallback: just use template with defaults
        return originalSend.call(this, solanaPaywallTemplate);
      }
    }
    return originalSend.call(this, data);
  };

  next();
});

// Configure the payment middleware
app.use(
  paymentMiddleware(
    "4XSRdDViZH2CPjLqF3M4eDmE1UPHfsjg49m86PMNdZAw" as SolanaAddress,
    {
      "/protected-route": {
        price: "$0.10",
        network: "solana-devnet",
        config: {
          description: "Access to premium content",
        },
      },
    },
    {
      url: "http://localhost:3002/facilitator",
    }
  )
);

// Example: A simple route
app.get("/", (req, res) => {
  res.json({
    message: "x402-Teller - Express Example",
    endpoints: {
      supported: "GET /facilitator/supported",
      verify: "POST /facilitator/verify",
      settle: "POST /facilitator/settle",
      dashboard: "GET /facilitator/dashboard",
    },
  });
});

// Implement your protected route
app.get("/protected-route", (_req, res) => {
  res.json({ message: "This content is behind a paywall" });
});

const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Facilitator endpoints available at http://localhost:${PORT}/facilitator`
  );
});
