"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDC");

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setAddress(text);
      }
    } catch (error) {
      // Fallback: focus input and let user paste manually with Ctrl+V
      console.log("[v0] Clipboard API not available, please paste manually");
      // Just focus the input field so user can paste manually
      const input = document.querySelector(
        'input[placeholder="Enter Address"]'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  };

  const handleMax = () => {
    setAmount("0.00000");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 relative border border-zinc-800/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Withdraw to Wallet</h2>
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
                className="bg-transparent border-none outline-none text-7xl font-bold text-zinc-400 w-full placeholder:text-zinc-700"
              />
              <span className="text-7xl font-bold text-zinc-400 ml-2">USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">0 0.00000 USDC</span>
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

        {/* Currency Selector */}
        <div className="mb-6">
          <button className="w-full bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-6 h-6 text-white"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.8-.01-2.25-1.97-2.86-3.65-3.39z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold">USDC</span>
            </div>
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Withdraw Button */}
        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl py-6 text-lg font-semibold mb-6 h-auto">
          Withdraw to wallet
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
