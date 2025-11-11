import express from "express";
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import {
  Facilitator,
  createExpressAdapter,
  type RoutesConfig,
} from "@x402-teller/core";
import { config } from "dotenv";
import cors from "cors";

config();

// Validate environment variables
const solanaPrivateKey = process.env.SVM_PRIVATE_KEY?.trim();
const solanaPublicKey = process.env.SVM_PUBLIC_KEY?.trim();
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
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static("public"));

const payWallRoutes: RoutesConfig = {
  "/premium-content": {
    price: "$0.10",
    network: "solana-devnet",
    config: { description: "Premium articles" },
  },
  "/premium-assets": {
    price: "$0.10",
    network: "solana-devnet",
    config: { description: "Premium files" },
  },
  "/premium-keys": {
    price: "$0.10",
    network: "solana-devnet",
    config: { description: "access to premium keys" },
  },
};

const facilitator = new Facilitator({
  solanaPrivateKey,
  solanaFeePayer: solanaPublicKey, // Your Solana public address
  networks: ["solana-devnet"],
  enableDashboard: true, // Enable transaction tracking
  dashboardOptions: {
    force: true, // Reset database on startup (DEVELOPMENT ONLY)
    autoInit: true, // Auto-initialize dashboard (default: true)
  },
  payWallRouteConfig: payWallRoutes,
});

// Add facilitator endpoints using the Express adapter
// This mounts GET /facilitator/supported, POST /facilitator/verify, POST /facilitator/settle
createExpressAdapter(facilitator, app, "/facilitator");

// Configure the payment middleware
app.use(
  paymentMiddleware(solanaPublicKey as SolanaAddress, payWallRoutes, {
    url: "http://localhost:3002/facilitator",
  })
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
