# x402-Teller Dashboard UI

Web dashboard for monitoring and managing your self-hosted x402 payment facilitator.

This Next.js application provides a secure, wallet-authenticated interface for viewing transaction history, analytics, and payment statistics from your x402-Teller facilitator.

---

## Features

### Secure Authentication

- **Solana Wallet Sign-In**: Connect with Phantom, Solflare, or any Solana wallet
- **Message Signing**: Cryptographic proof of wallet ownership
- **Facilitator-Only Access**: Only the facilitator wallet owner can access the dashboard
- **NextAuth.js Integration**: Session management and CSRF protection

### Transaction Monitoring

- **Real-Time Dashboard**: View transaction statistics and analytics
- **Transaction History**: Paginated list of all payments with details
- **Status Tracking**: Monitor pending, verified, settled, and failed transactions
- **Transaction Details**: View amounts, networks, buyer addresses, and transaction hashes

### Analytics

- **Total Transactions**: Count of all payment attempts
- **Success Rate**: Percentage of successful settlements
- **Payment Volume**: Total value of all transactions
- **Network Breakdown**: View transactions by network (Solana, Base, etc.)

---

## Prerequisites

- [Bun](https://bun.sh/) installed
- A running x402-Teller facilitator instance
- Solana wallet (Phantom, Solflare, etc.) for authentication

---

## Getting Started

### 1. Install Dependencies

From the UI package directory:

```bash
cd packages/ui
bun install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_min_32_chars
NEXTAUTH_URL=http://localhost:3001

# Facilitator API
FACILITATOR_API_URL=http://localhost:3000

# Public Keys (for authentication verification)
NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY=your_solana_public_key_base58
```

**Generate `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

### 3. Run the Development Server

```bash
bun run dev
```

The dashboard will be available at [http://localhost:3001](http://localhost:3001)

### 4. Sign In

1. Open the dashboard in your browser
2. Click "Connect Wallet"
3. Select your Solana wallet (Phantom, Solflare, etc.)
4. Approve the connection
5. Sign the authentication message
6. You'll be redirected to the dashboard if your wallet matches the facilitator's public key

---

## Project Structure

```
packages/ui/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts          # NextAuth configuration
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Dashboard page (protected)
│   │   ├── page.tsx                      # Sign-in page
│   │   ├── layout.tsx                    # Root layout
│   │   ├── providers.tsx                 # Wallet adapter provider
│   │   └── globals.css                   # Global styles
│   └── utils/
│       └── sign-in.ts                    # Message signing utilities
├── .env.local                            # Environment variables
└── package.json
```

---

## How Authentication Works

1. **Wallet Connection**: User connects their Solana wallet via WalletAdapter
2. **Message Generation**: Frontend creates a sign-in message with domain and nonce
3. **Signature**: User signs the message with their wallet
4. **Verification**: Backend verifies:
   - Signature is valid for the message
   - Wallet address matches the facilitator's public key
5. **Session**: If valid, NextAuth creates a session and issues a JWT
6. **Access Control**: Only authenticated users can access `/dashboard`

---

## API Integration

The dashboard fetches data from your facilitator's API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /public-keys` | Get facilitator's public keys for auth verification |
| `GET /dashboard` | Fetch transaction statistics |
| `GET /dashboard/transactions` | Fetch paginated transaction history |

Configure the base URL via `FACILITATOR_API_URL` environment variable.

---

## Building for Production

### Build the Application

```bash
bun run build
```

### Start Production Server

```bash
bun run start
```

The optimized build will be served on port 3001 (or the port specified in your environment).

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret for encrypting session tokens | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the dashboard | `http://localhost:3001` |
| `FACILITATOR_API_URL` | URL of your facilitator API | `http://localhost:3000` |
| `NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY` | Facilitator's Solana public key (Base58) | `9xQeW...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the dashboard on | `3000` |

---

## Security Considerations

### Authentication Security

- Only the facilitator wallet owner can access the dashboard
- Message signing proves wallet ownership cryptographically
- Sessions are encrypted with `NEXTAUTH_SECRET`
- CSRF protection enabled via NextAuth

### Best Practices

- **Never commit `.env.local`** - contains sensitive secrets
- Use a strong, randomly generated `NEXTAUTH_SECRET`
- In production, use HTTPS for both dashboard and facilitator API
- Regularly rotate `NEXTAUTH_SECRET` if compromised
- Set secure cookie settings in production (httpOnly, secure, sameSite)

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `packages/ui`
4. Configure environment variables in Vercel dashboard
5. Deploy

### Self-Hosted

1. Build the application: `bun run build`
2. Set production environment variables
3. Run: `bun run start`
4. Use a reverse proxy (nginx, caddy) for HTTPS
5. Consider using PM2 or similar for process management

---

## Customization

### Styling

The dashboard uses Tailwind CSS. Customize colors, fonts, and spacing in:

- `tailwind.config.js` - Tailwind configuration
- `src/app/globals.css` - Global styles and CSS variables

### Branding

Update the following files to customize branding:

- `src/app/layout.tsx` - Site title and metadata
- `src/app/favicon.ico` - Favicon

### Adding Features

The dashboard is built with the Next.js App Router. To add new pages:

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file
3. Protect routes by checking auth in the page component
4. Fetch data from facilitator API using SWR

---

## Troubleshooting

### "Unable to connect to facilitator"

- Verify `FACILITATOR_API_URL` is correct
- Ensure your facilitator is running
- Check CORS settings on your facilitator

### "Wallet address does not match facilitator"

- Verify `NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY` matches your facilitator's Solana public key
- Ensure you're using the correct wallet

### Authentication Issues

- Clear browser cookies and try again
- Regenerate `NEXTAUTH_SECRET` if it was compromised
- Check that `NEXTAUTH_URL` matches your dashboard URL

---

## Development

### Run in Development Mode

```bash
bun run dev
```

### Linting

```bash
bun run lint
```

---

## Contributing

This package is part of the [x402-Teller](../../) monorepo. Contributions are welcome!

---

## License

See [LICENSE](../../LICENSE) for details.

---

**Part of x402-Teller** - Self-sovereign payment infrastructure for the open web.
