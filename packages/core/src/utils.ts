import type { SolanaNetwork } from "./facilitator";

export function toX402Network(network: SolanaNetwork): string {
  return network;
}

export function isSolanaNetwork(network: SolanaNetwork): network is SolanaNetwork {
  return network === "solana" || network === "solana-devnet";
}
