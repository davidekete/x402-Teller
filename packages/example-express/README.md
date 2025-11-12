# x402-Teller - Express Example

This example demonstrates how to set up a self-hosted x402 payment facilitator with Solana support using Express.

## What is a Facilitator?

A facilitator is a service that handles payment verification and settlement for x402 payments. Instead of relying on third-party hosted facilitators, this example shows how to run your own with complete control over payment infrastructure.

## Features

- ✅ Self-hosted payment facilitator
- ✅ Solana network support (mainnet and devnet)
- ✅ Express integration with `createExpressAdapter`
- ✅ Payment middleware for protecting routes
- ✅ Automatic transaction tracking with SQLite
- ✅ Dashboard endpoints for analytics

## Setup

1. Install dependencies:

```bash
bun install
```

2. Set your environment variables:

Create a `.env` file with:

```bash
SVM_PRIVATE_KEY=your_base58_private_key
SVM_PUBLIC_KEY=your_base58_public_key
PORT=3002
```

3. Run the server:

```bash
bun run dev
```

## How it Works

### 1. Initialize the Facilitator

```typescript
import { Facilitator, createExpressAdapter } from "@x402-teller/core";

const facilitator = new Facilitator({
  solanaPrivateKey: process.env.SVM_PRIVATE_KEY!,
  solanaFeePayer: process.env.SVM_PUBLIC_KEY!,
  networks: ["solana-devnet"], // or "solana" for mainnet
  payWallRouteConfig: {
    "/premium-content": {
      price: "$0.10",
      network: "solana-devnet",
      config: { description: "Premium articles" },
    },
  },
});
```

### 2. Mount Facilitator Endpoints

The Express adapter automatically sets up all facilitator endpoints:

```typescript
createExpressAdapter(facilitator, app, "/facilitator");
```

This creates:
- `GET /facilitator/supported` - Lists supported payment networks
- `GET /facilitator/public-keys` - Returns facilitator's public keys
- `POST /facilitator/verify` - Verifies a payment authorization
- `POST /facilitator/settle` - Settles a payment on-chain
- `GET /facilitator/balance` - Returns USDC balance
- `GET /facilitator/dashboard/transactions` - Returns transaction history
- `GET /facilitator/dashboard/endpoints` - Returns endpoint statistics

### 3. Add Payment Middleware

```typescript
import { paymentMiddleware } from "x402-express";

app.use(
  paymentMiddleware(
    "YourSolanaPublicKey", // Your Solana wallet address
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
```

### 4. Create Protected Routes

```typescript
app.get("/protected-route", (req, res) => {
  res.json({ message: "This content is behind a paywall" });
});
```

## Testing

Test the facilitator endpoints:

```bash
# Check supported payment types
curl http://localhost:3002/facilitator/supported

# Check facilitator balance
curl http://localhost:3002/facilitator/balance?network=solana-devnet

# Access a protected route (requires payment)
curl http://localhost:3002/protected-route
```

## Dashboard

This example includes automatic transaction tracking. You can:

1. View transaction history: `GET /facilitator/dashboard/transactions`
2. View endpoint statistics: `GET /facilitator/dashboard/endpoints?timeframe=24h`
3. Use the [create-x402-dashboard](../create-x402-dashboard/) CLI to scaffold a full UI dashboard

To scaffold the dashboard:

```bash
bunx create-x402-dashboard my-dashboard
cd my-dashboard
bun dev
```

## Database

Transaction data is automatically stored in `./x402-teller.db` (SQLite). You can customize the database location:

```bash
# Use custom location
DB_STORAGE=/path/to/database.db bun run dev

# Use in-memory database (for testing)
DB_STORAGE=:memory: bun run dev
```

## Security Notes

- Never commit your `SVM_PRIVATE_KEY` to version control
- Use environment variables for all sensitive data
- Your facilitator private key is a **hot wallet** with direct access to settle authorized payments
- Consider using a dedicated wallet for your facilitator with just enough funds for gas fees
- Use devnet for development and testing
- Monitor transaction activity regularly via dashboard endpoints
- Implement rate limiting on facilitator endpoints in production

## Learn More

- [x402 Protocol Documentation](https://docs.x402.org)
- [x402-Teller Core Package](../core/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

