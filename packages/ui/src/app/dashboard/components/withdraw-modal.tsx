"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBalance } from "@/lib/api";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// USDC token mint addresses
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<"solana" | "solana-devnet">(
    "solana-devnet"
  );
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Auto-detect network from connection endpoint
  useEffect(() => {
    if (isOpen && connection) {
      const endpoint = connection.rpcEndpoint;
      // Check if endpoint contains 'mainnet' or 'devnet'
      if (endpoint.includes('mainnet')) {
        setNetwork("solana");
      } else if (endpoint.includes('devnet') || endpoint.includes('testnet')) {
        setNetwork("solana-devnet");
      }
      // Default to devnet if cannot detect
    }
  }, [isOpen, connection]);

  // Fetch balance when modal opens or network changes
  useEffect(() => {
    if (isOpen) {
      loadBalance();
    }
  }, [isOpen, network]);

  const loadBalance = async () => {
    try {
      const result = await fetchBalance(network);

      if (result.success && result.balance !== undefined) {
        setBalance(result.balance);
      }
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setAddress(text);
      }
    } catch (error) {
      const input = document.querySelector(
        'input[placeholder="Enter Address"]'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  };

  const handleMax = () => {
    // Convert token units to human-readable format (divide by 1,000,000)
    const maxAmount = balance / 1_000_000;
    setAmount(maxAmount.toFixed(2));
  };

  const handleWithdraw = async () => {
    setError("");
    setSuccess("");

    // Check wallet connection
    if (!publicKey) {
      setError("Wallet not connected. Please refresh and ensure your wallet is connected.");
      return;
    }

    if (!signTransaction) {
      setError("Your wallet doesn't support signing. Please use a compatible wallet like Phantom or Solflare.");
      return;
    }

    // Validation
    if (!address.trim()) {
      setError("Please enter a recipient address");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Convert to base units (multiply by 1,000,000)
    const amountInBaseUnits = Math.floor(amountNum * 1_000_000);

    if (amountInBaseUnits > balance) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);

    try {
      // Validate recipient address
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(address);
      } catch {
        setError("Invalid recipient address");
        setIsLoading(false);
        return;
      }

      const usdcMint =
        network === "solana" ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
      const mintPubkey = new PublicKey(usdcMint);

      // Get associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      // Check if recipient token account exists
      let toAccountExists = true;
      try {
        await getAccount(connection, toTokenAccount);
      } catch {
        toAccountExists = false;
      }

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget if needed (for reliability)
      // transaction.add(
      //   ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })
      // );

      // If recipient token account doesn't exist, create it
      if (!toAccountExists) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            toTokenAccount, // associated token account
            recipientPubkey, // owner
            mintPubkey // mint
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          publicKey,
          amountInBaseUnits
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Request user to sign the transaction
      const signedTransaction = await signTransaction(transaction);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Wait for confirmation
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      setSuccess(
        `Successfully withdrew ${amount} USDC!`
      );
      setAddress("");
      setAmount("");
      await loadBalance(); // Refresh balance

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Withdrawal error:", err);

      // Handle user rejection
      if (err.message?.includes("User rejected")) {
        setError("Transaction was rejected");
      } else {
        setError(err.message || "Withdrawal failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Format balance for display (divide by 1,000,000)
  const displayBalance = (balance / 1_000_000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 relative border border-zinc-800/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Withdraw USDC</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {network === "solana" ? "Mainnet" : "Devnet"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {/* Address Input */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
            <div className="flex-1">
              <label className="text-sm text-zinc-400 mb-1 block">To</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Address"
                className="bg-transparent border-none p-0 h-auto text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-600"
              />
            </div>
            <Button
              onClick={handlePaste}
              variant="ghost"
              className="text-white hover:bg-zinc-800 rounded-xl px-4 py-2 h-auto"
            >
              Paste
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent border-none outline-none text-5xl font-bold text-white w-full placeholder:text-zinc-700"
              />
              <span className="text-5xl font-bold text-zinc-400 ml-2">
                USDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                Balance: {displayBalance} USDC
              </span>
              <Button
                onClick={handleMax}
                variant="outline"
                className="rounded-full px-6 py-1 h-auto text-sm border-zinc-700 hover:bg-zinc-800 text-white bg-transparent"
              >
                Max
              </Button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Security Notice */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs">
          🔒 Your wallet will prompt you to sign this transaction
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !publicKey}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 text-lg font-semibold mb-6 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
          title={!publicKey ? "Wallet not connected" : undefined}
        >
          {isLoading
            ? "Awaiting signature..."
            : !publicKey
            ? "Wallet Not Connected"
            : "Sign & Withdraw"}
        </Button>

        {/* Offramp Section */}
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">
            Withdrawals to offramp coming soon!
          </p>
          <Button
            disabled
            className="w-full bg-teal-700/30 hover:bg-teal-700/30 text-teal-600/50 rounded-2xl py-6 text-lg font-semibold h-auto cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg
              viewBox="0 0 120 40"
              className="w-32 h-10 opacity-50"
              fill="currentColor"
            >
              <path d="M20 10 L35 25 L20 30 Z" />
              <text x="45" y="28" className="font-semibold text-xl">
                offramp
              </text>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
