# `@x402-teller/core`

Self-hosted x402 payment facilitator with Solana support.

This package lets API sellers run their own x402 facilitator instead of relying on third-party services like Coinbase. It supports Solana networks with built-in transaction tracking and dashboard capabilities.

**What this package provides:**

- Payment verification and on-chain settlement
- Solana support (mainnet and devnet)
- Transaction tracking with database models (Sequelize ORM)
- Dashboard endpoints for analytics and transaction history
- Public key endpoints for wallet-based authentication
- Framework adapters for Express

**Core endpoints:**

- `GET /supported` - Lists supported payment networks
- `GET /public-keys` - Returns facilitator's public keys
- `POST /verify` - Verifies buyer's signed payment intent
- `POST /settle` - Settles payment on-chain
- `GET /dashboard` - Returns transaction statistics
- `GET /dashboard/transactions` - Returns paginated transaction history

No external facilitator. No third-party dependencies. Your own infrastructure.

---

## Installation

```bash
npm install @x402-teller/core
# or
bun add @x402-teller/core
```

**Peer Dependencies:**

- `express` (optional) - if using Express adapter
- `@solana/web3.js` - for Solana networks

---

## Quick Start

### Option 1: Using Built-in Adapters (Recommended)

#### With Express

```ts
import express from "express";
import { Facilitator, createExpressAdapter } from "@x402-teller/core";

const app = express();
app.use(express.json());

const facilitator = new Facilitator({
  solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY!,
  solanaFeePayer: process.env.SOLANA_PUBLIC_KEY!,
  networks: ["solana-devnet"], // or "solana"
});

// Mounts all facilitator endpoints at /facilitator
createExpressAdapter(facilitator, app, "/facilitator");

app.listen(3000, () => console.log("Facilitator running on :3000"));
```

### Option 2: Manual Setup (Any Framework)

If you're using a different framework or want more control, you can use the Facilitator methods directly:

```ts
import { Facilitator } from "@x402-teller/core";

const facilitator = new Facilitator({
  solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY!,
  solanaFeePayer: process.env.SOLANA_PUBLIC_KEY!,
  networks: ["solana-devnet"],
});

// Map these methods to your routes:

// GET /supported
const supported = facilitator.listSupportedKinds();

// POST /verify
const result = await facilitator.verifyPayment(paymentPayload, paymentRequirements);

// POST /settle
const settlement = await facilitator.settlePayment(paymentPayload, paymentRequirements);

// GET /dashboard
const stats = await facilitator.getDashboardStats();

// GET /dashboard/transactions?limit=20&offset=0
const transactions = await facilitator.getTransactions(20, 0);
```

### Configuring Your API

Point your `paymentMiddleware` to use your facilitator:

```ts

paymentMiddleware(
  "your_receiving_address", // Your wallet address
  {
    "/protected-route": {
      price: "$0.10",
      network: "solana-devnet",
      config: { description: "Premium content" },
    },
  },
  {
    url: "http://localhost:3000/facilitator", // Your facilitator URL
  }
);
```

Now when clients hit `/protected-route`:
- They see the x402 payment flow
- Your facilitator verifies and settles the payment
- Settlement happens with **your** key on-chain
- No third-party services involved

---

## API Reference

### Constructor

```ts
new Facilitator({
  solanaPrivateKey: string;    // Base58-encoded private key
  solanaFeePayer: string;      // Base58-encoded public key
  networks: SolanaNetwork[];   // e.g., ["solana-devnet", "solana"]
  minConfirmations?: number;   // Optional (not enforced yet)
})
```

### Methods

#### `listSupportedKinds()`

Returns the list of supported payment networks and kinds.

**Returns:** `{ kinds: Array<{ x402Version: 1; scheme: "exact"; network: string }> }`

**Used for:** `GET /supported`

---

---

#### `verifyPayment(paymentPayload, paymentRequirements)`

Verifies that a buyer's signed payment intent is valid without executing the settlement.

**Parameters:**
- `paymentPayload` - The payment data from the buyer
- `paymentRequirements` - The expected payment requirements

**Returns:** `Promise<{ valid: boolean }>`

**Used for:** `POST /verify`

---

#### `settlePayment(paymentPayload, paymentRequirements)`

Executes the payment settlement on-chain using your private key.

**Parameters:**
- `paymentPayload` - The payment data from the buyer
- `paymentRequirements` - The expected payment requirements

**Returns:** `Promise<{ settled: boolean; txHash?: string }>`

**Used for:** `POST /settle`

---

#### `getDashboardStats()`

Returns aggregated statistics about all transactions.

**Returns:**
```ts
Promise<{
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolume: string;
  successRate: number;
}>
```

**Used for:** `GET /dashboard`

---

#### `getTransactions(limit?, offset?)`

Returns paginated transaction history.

**Parameters:**
- `limit` (optional) - Number of transactions to return (default: 20)
- `offset` (optional) - Number of transactions to skip (default: 0)

**Returns:** `Promise<Transaction[]>`

**Used for:** `GET /dashboard/transactions`

---

## Transaction Tracking

The facilitator automatically tracks all payment transactions in a database using Sequelize ORM. Transaction records include:

- Payment ID and timestamp
- Network and amount
- Buyer and seller addresses
- Transaction hash
- Status (pending, verified, settled, failed)
- Error messages (if any)

**Database Support:**
- SQLite (default, for development)
- PostgreSQL (recommended for production)

Configure the database connection via environment variables or pass a Sequelize instance to the Facilitator constructor.

---

## Framework Adapters

Built-in adapters automatically mount all facilitator endpoints:


```ts

```

**Mounted endpoints:**
- `GET /facilitator/supported`
- `GET /facilitator/public-keys`
- `POST /facilitator/verify`
- `POST /facilitator/settle`
- `GET /facilitator/dashboard`
- `GET /facilitator/dashboard/transactions`

### Express Adapter

```ts
import { createExpressAdapter } from "@x402-teller/core";

createExpressAdapter(facilitator, app, "/facilitator");
```


### Custom Framework

For other frameworks, use the Facilitator methods directly and map them to your routes. See the "Manual Setup" section above.

---

## Security Considerations

### Hot Wallet Warning

- Your Solana private key is a **hot wallet**
- This key pays gas fees and executes on-chain settlements
- It has direct access to pull authorized funds from buyers
- **Never commit private keys to version control**
- Store them securely using environment variables or KMS

### Best Practices

- Use separate wallets for facilitator operations vs. long-term storage
- Monitor transaction activity regularly via the dashboard endpoints
- Set up alerts for unusual transaction patterns
- Keep the facilitator wallet funded with just enough for gas fees
- Regularly rotate keys if possible
- Use testnet (devnet) for development and testing
- Implement rate limiting on your facilitator endpoints
- Use HTTPS in production

---

## Examples

Full working examples are available in the monorepo:

- **[Express + Solana](../example-express/)** - Complete Solana devnet implementation with dashboard

Both examples include:
- Environment configuration
- Facilitator setup
- Protected routes with x402 payment requirements
- Transaction tracking

---

## What's Included

- ✅ Solana support (mainnet and devnet)
- ✅ Payment verification and settlement
- ✅ Transaction tracking and database models
- ✅ Dashboard analytics endpoints
- ✅ Public key endpoints for authentication
- ✅ TypeScript support with full type definitions

## What's Not Included

- ❌ Entitlement management (tracking who paid for what) - implement this in your application layer
- ❌ Subscription or recurring payment logic
- ❌ Refund functionality
- ❌ Multi-signature wallet support
- ❌ Frontend UI (see [@x402-teller/ui](../ui/) for dashboard UI)

---

## Contributing

This package is part of the [x402-Teller](../../) monorepo. Contributions are welcome!

## License

See [LICENSE](../../LICENSE) for details.

---

**Part of x402-Teller** - Self-sovereign payment infrastructure for the open web.
