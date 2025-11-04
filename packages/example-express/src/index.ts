import express from "express";
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import { Facilitator, createExpressAdapter } from "@x402-sovereign/core";
import { config } from "dotenv";

config();

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
  solanaPrivateKey: process.env.SVM_PRIVATE_KEY as string,
  solanaFeePayer: "4XSRdDViZH2CPjLqF3M4eDmE1UPHfsjg49m86PMNdZAw", // Your Solana public address
  networks: ["solana-devnet"],
});

// Add facilitator endpoints using the Express adapter
// This mounts GET /facilitator/supported, POST /facilitator/verify, POST /facilitator/settle
createExpressAdapter(facilitator, app, "/facilitator");

// Configure the payment middleware
app.use(
  paymentMiddleware(
    "4XSRdDViZH2CPjLqF3M4eDmE1UPHfsjg49m86PMNdZAw" as SolanaAddress, // Your Solana wallet
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
    message: "X402 Sovereign Facilitator - Express Example",
    endpoints: {
      supported: "GET /facilitator/supported",
      verify: "POST /facilitator/verify",
      settle: "POST /facilitator/settle",
    },
  });
});

// Implement your protected route
app.get("/protected-route", (req, res) => {
  res.json({ message: "This content is behind a paywall" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Facilitator endpoints available at http://localhost:${PORT}/facilitator`
  );
});
