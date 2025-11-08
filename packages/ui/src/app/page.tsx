"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { SigninMessage } from "../../utils/sign-in";
import bs58 from "bs58";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey, connected, signMessage } = useWallet();
  const router = useRouter();
  const walletModal = useWalletModal();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (connected && publicKey && !session) {
      console.log("Wallet connected, prompting sign-in...");
      handleSignIn();
    }
  }, [connected, publicKey, session]);

  // Effect 2: Redirect when authenticated
  useEffect(() => {
    if (session) {
      console.log("User authenticated, redirecting...");
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    try {
      if (!connected) {
        walletModal.setVisible(true);
      }

      const csrf = await getCsrfToken();
      if (!publicKey || !csrf || !signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey?.toBase58(),
        statement: `Sign this message to view your dashboard`,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const serializedSignature = bs58.encode(signature);

      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });
    } catch (error) {
      console.log(error);
    }
  };

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
