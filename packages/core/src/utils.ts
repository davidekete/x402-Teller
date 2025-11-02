import { base, baseSepolia, type Chain } from "viem/chains";
import type { SolanaNetwork } from "./facilitator";

export function fromViemNameToX402Network(chain: Chain): string {
  switch (chain) {
    case base:
      return "base";
    case baseSepolia:
      return "base-sepolia";
    default:
      return chain.name.toLowerCase().replaceAll(" ", "-");
  }
}

export function toX402Network(network: Chain | SolanaNetwork): string {
  if (typeof network === "string") {
    return network;
  }
  return fromViemNameToX402Network(network);
}

export function isSolanaNetwork(network: Chain | SolanaNetwork): network is SolanaNetwork {
  return typeof network === "string" && (network === "solana" || network === "solana-devnet");
}
