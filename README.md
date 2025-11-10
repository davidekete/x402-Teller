# x402-Teller

Self-hosted payment facilitator for x402 with dashboard.

X402-Teller is a complete solution for running your own x402 payment facilitator. It lets API sellers and content providers accept payments on-chain (Solana & EVM) without relying on third-party facilitators like Coinbase.

**What you get:**

- Self-hosted payment verification and settlement
- Multi-chain support (Solana, Base, and other EVM networks)
- Transaction dashboard with analytics and history
- Wallet-based authentication (Solana Sign-In)
- Framework adapters for Express

When you run x402-Teller, you control:

- Payment verification (`/verify`) - validates buyer's signed payment intent
- On-chain settlement (`/settle`) - pulls authorized funds from buyers
- Network configuration (`/supported`) - declares which chains you accept
- Transaction history and analytics via web dashboard

No external facilitator. No third-party dependencies. Your own infrastructure.

---

## Project Structure

This is a monorepo containing:

- **[ui](./packages/ui/)** - Next.js dashboard for transaction monitoring and analytics
- **[example-express](./packages/example-express/)** - Solana devnet example with Express

---

## Features

### Payment Facilitator

- **Multi-chain support**: Solana (mainnet/devnet) and EVM networks (Base, Base Sepolia, etc.)
- **Framework-agnostic core**: Use with Express or any HTTP server
- **Automatic settlement**: Pulls authorized funds from buyers on-chain
- **Transaction tracking**: Built-in database models for monitoring all payments

### Dashboard (UI)

- **Secure authentication**: Sign-in with Solana wallet (facilitator wallet only)
- **Transaction history**: Paginated view of all payments with status and details
- **Analytics**: Total transactions, success rate, and payment volume
- **Real-time updates**: SWR-based data fetching for live dashboard
- **Responsive design**: Built with Next.js 15 and Tailwind CSS

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed (package manager)
- A wallet with funds for gas fees (Solana or EVM network)
- Private keys for payment settlement

### 1. Clone and Install

```bash
git clone <repository-url>
cd x402-Teller
bun install
```

### 2. Set Up Environment Variables


```bash
# Solana example (example-express)
SOLANA_PRIVATE_KEY=your_base58_private_key
SOLANA_PUBLIC_KEY=your_public_key
PORT=3000

EVM_PRIVATE_KEY=0x...
PORT=3000
```

**For the dashboard (packages/ui):**

```bash
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3001
FACILITATOR_API_URL=http://localhost:3000
NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY=your_solana_public_key
```

### 3. Run the Facilitator

**Option A: Solana (Express example)**

```bash
cd packages/example-express
bun run dev
```


```bash
bun run dev
```

### 4. Run the Dashboard (Optional)

```bash
cd packages/ui
bun run dev
```

The dashboard will be available at `http://localhost:3001`. Sign in with the facilitator wallet to view transactions and analytics.

### 5. Configure Your API

Point your `paymentMiddleware` at your facilitator:

```ts

paymentMiddleware(
  "your_receiving_address",
  {
    "/protected-route": {
      price: "$0.10",
      network: "solana-devnet", // or "base-sepolia"
      config: { description: "Premium content" },
    },
  },
  {
    url: "http://localhost:3000/facilitator",
  }
);
```

Now your API accepts x402 payments through your own facilitator!

---

## API Endpoints

The facilitator exposes these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/supported` | List supported payment networks and kinds |
| `GET` | `/public-keys` | Return facilitator's public keys (for authentication) |
| `POST` | `/verify` | Verify a payment authorization is valid |
| `POST` | `/settle` | Execute payment settlement on-chain |
| `GET` | `/dashboard` | Dashboard statistics (total transactions, volume, success rate) |
| `GET` | `/dashboard/transactions?limit=20&offset=0` | Paginated transaction history with optional filters |
| `GET` | `/dashboard/endpoints?timeframe=24h` | Endpoint statistics with usage analytics |

## Core Package API

### Creating a Facilitator

**For EVM Networks:**

```ts
import { Facilitator } from "@x402-teller/core";
import { baseSepolia } from "viem/chains";

const facilitator = new Facilitator({
  evmPrivateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  networks: [baseSepolia],
});
```

**For Solana:**

```ts
import { Facilitator } from "@x402-teller/core";

const facilitator = new Facilitator({
  solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  solanaPublicKey: process.env.SOLANA_PUBLIC_KEY,
  networks: ["solana-devnet"], // or "solana-mainnet"
});
```

### Methods

- **`listSupportedKinds()`** - Returns supported payment networks
- **`getPublicKeys()`** - Returns facilitator's public keys for authentication
- **`verifyPayment(payload, requirements)`** - Validates payment authorization
- **`settlePayment(payload, requirements)`** - Executes on-chain settlement
- **`getDashboardStats()`** - Returns transaction statistics
- **`getTransactions(limit?, offset?)`** - Returns paginated transaction history

---

## Dashboard Authentication

The UI dashboard uses **Solana wallet-based authentication**:

1. User connects their Solana wallet (Phantom, Solflare, etc.)
2. Wallet signs a message to prove ownership
3. Backend verifies the signature and checks if the wallet matches the facilitator's public key
4. Only the facilitator wallet owner can access the dashboard

This ensures that only you can view your payment data and transaction history.

---

## Security Considerations

### Hot Wallet Warning

- Your private keys (`evmPrivateKey` or `solanaPrivateKey`) are **hot wallets**
- These keys pay gas fees and execute on-chain settlements
- They have direct access to pull authorized funds from buyers
- **Never commit private keys to version control**
- Store them securely using environment variables or KMS

### Best Practices

- Use separate wallets for facilitator operations vs. long-term storage
- Monitor transaction activity regularly via the dashboard
- Set up alerts for unusual transaction patterns
- Keep the facilitator wallet funded with just enough for gas fees
- Regularly rotate keys if possible
- Use testnet (devnet/sepolia) for development and testing

---

## Framework Adapters

Built-in adapters make integration easy:


```ts

```

### Express

```ts
import { createExpressAdapter } from "@x402-teller/core";

createExpressAdapter(facilitator, app, "/facilitator");
```

### Custom Integration

For other frameworks, use the core methods directly and map them to your routes.

---

## Examples

- **[Express + Solana Example](./packages/example-express/)** - Full Solana devnet implementation
- **[Dashboard UI](./packages/ui/)** - Next.js dashboard with wallet auth

---

## Tech Stack

- **Runtime**: Bun
- **Backend**: Express (framework-agnostic core)
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Blockchain**: Viem (EVM), Solana Web3.js
- **Database**: Sequelize ORM (SQLite/PostgreSQL)
- **Auth**: NextAuth.js with Solana wallet adapter
- **Payment Protocol**: x402

---

## Contributing

This is an open-source project. Contributions are welcome!

## License

See [LICENSE](./LICENSE) for details.

---

**Built with x402** - Self-sovereign payments for the open web.
