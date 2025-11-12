# create-x402-dashboard

Scaffold an x402-Teller dashboard in seconds.

## Usage

### With bunx (recommended)

```bash
bunx create-x402-dashboard my-dashboard
```

### With npx

```bash
npx create-x402-dashboard my-dashboard
```

### Interactive Mode

If you don't provide a project name, the CLI will prompt you:

```bash
bunx create-x402-dashboard
```

## What It Does

The CLI will:

1. ✅ Create a new directory for your dashboard
2. ✅ Copy all dashboard files (Next.js 15 + React 19)
3. ✅ Generate `.env.local` with your configuration
4. ✅ Install dependencies (optional)
5. ✅ Provide next steps to run the dashboard

## Configuration Prompts

The CLI will ask you for:

- **Project name** - Directory name for the dashboard
- **Facilitator API URL** - URL of your running facilitator (e.g., `http://localhost:3000`)
- **Facilitator public key** - Your Solana wallet public key
- **Dashboard port** - Port to run the dashboard on (default: 3001)
- **Install dependencies** - Whether to automatically install dependencies

## What You Get

After scaffolding, you'll have a complete Next.js dashboard with:

- 🔐 **Wallet-based authentication** - Only facilitator wallet can access
- 📊 **Transaction history** - Paginated view of all payments
- 📈 **Analytics** - Total transactions, success rate, volume
- 🎨 **Responsive design** - Built with Tailwind CSS
- ⚡ **Real-time updates** - SWR-based data fetching

## Example

```bash
$ bunx create-x402-dashboard my-dashboard

🚀 x402-Teller Dashboard Setup

✔ Facilitator API URL: … http://localhost:3000
✔ Facilitator Solana public key: … Abc123...
✔ Dashboard port: … 3001
✔ Install dependencies now? … yes

✓ Project directory created
✓ Dashboard files copied
✓ Configuration generated
✓ Dependencies installed

✅ Dashboard scaffolded successfully!

📂 Location: /path/to/my-dashboard
🔑 Config: .env.local (created)

📝 Next steps:

  cd my-dashboard
  bun dev

  Dashboard will be available at http://localhost:3001

🔐 Authentication:

  Sign in with your facilitator wallet to access the dashboard
  Only the facilitator wallet owner can view transaction data
```

## Requirements

- Node.js 18+ or Bun
- A running x402-Teller facilitator
- Facilitator's Solana public key

## Related Packages

- [`@x402-teller/core`](../core) - Core facilitator package
- [`x402-teller`](../../) - Full monorepo with examples

## License

MIT
