"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();

  // Redirect to dashboard or main app when connected
  useEffect(() => {
    if (connected && publicKey) {
      // Optional: redirect to a dashboard or main app page
      // router.push('/dashboard')
    }
  }, [connected, publicKey, router]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden flex items-center justify-center">
      {/* Decorative gradient blob - bottom left */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400 to-purple-300 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2" />

      {/* Decorative gradient blob - bottom right */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400 to-purple-300 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl font-semibold text-white mb-3">Sign In</h1>

        <p className="font-inter text-gray-400 text-sm mb-8">
          Connect your solana wallet address to continue
        </p>

        {/* Custom styled wallet button */}
        <div className="flex justify-center mb-6">
          <WalletMultiButton
            style={{
              backgroundColor: "#2a2a2a",
              color: "white",
              fontSize: "15px",
              fontWeight: "500",
              padding: "14px 32px",
              borderRadius: "8px",
              border: "none",
              transition: "all 0.2s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
