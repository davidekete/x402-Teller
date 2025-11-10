# Framework Adapters

The `@x402-teller/core` package includes built-in adapters for popular Node.js frameworks.

## Available Adapters

### Express Adapter

For [Express](https://expressjs.com/) applications:

```typescript
import express from "express";
import { Facilitator, createExpressAdapter } from "@x402-teller/core";
import { baseSepolia } from "viem/chains";

const app = express();
app.use(express.json());

const facilitator = new Facilitator({
  evmPrivateKey: process.env.EVM_PRIVATE_KEY!,
  networks: [baseSepolia],
});

// Mount at /facilitator
createExpressAdapter(facilitator, app, "/facilitator");

// Or mount at root
createExpressAdapter(facilitator, app);
```

## Mounted Endpoints

Both adapters create the following endpoints:

- `GET {basePath}/supported` - Lists supported payment kinds
- `POST {basePath}/verify` - Verifies a payment authorization
- `POST {basePath}/settle` - Settles a payment on-chain

## Custom Implementation

If you're using a different framework, you can use the `handleRequest` method directly:

```typescript
const facilitator = new Facilitator({
  evmPrivateKey: process.env.EVM_PRIVATE_KEY!,
  networks: [baseSepolia],
});

// In your framework's route handler:
const response = await facilitator.handleRequest({
  method: "POST",
  path: "/verify",
  body: requestBody,
});

// Return response.status and response.body to the client
```

## Peer Dependencies

The adapters have optional peer dependencies:

```json
{
  "peerDependencies": {
    "express": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "express": { "optional": true }
  }
}
```

You only need to install the framework you're using:

```bash

# For Express
bun add express @types/express
```

## Examples

See the example implementations:

- **Express**: [`packages/example-express/`](../example-express/)
