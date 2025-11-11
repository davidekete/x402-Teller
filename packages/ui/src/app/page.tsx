"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCsrfToken, signIn, useSession } from "next-auth/react";
import { SigninMessage } from "../../utils/sign-in";
import bs58 from "bs58";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Link } from "lucide-react";

export default function Home() {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const router = useRouter();
  const walletModal = useWalletModal();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Effect: Redirect when authenticated
  useEffect(() => {
    if (session) {
      console.log("User authenticated, redirecting...");
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);

      // Check if wallet is connected before proceeding
      if (!connected) {
        walletModal.setVisible(true);
        setIsSigningIn(false);
        return; // Stop execution until wallet is connected
      }

      // Ensure we have all required dependencies
      if (!publicKey || !signMessage) {
        setError(
          "Wallet not fully connected. Please try reconnecting your wallet."
        );
        setIsSigningIn(false);
        return;
      }

      const csrf = await getCsrfToken();
      if (!csrf) {
        setError(
          "Failed to get security token. Please refresh the page and try again."
        );
        setIsSigningIn(false);
        return;
      }

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        statement: `Sign this message to view your dashboard`,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const serializedSignature = bs58.encode(signature);

      const result = await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });

      if (result?.error) {
        setError(
          "Authentication failed. Make sure you're using the correct wallet."
        );
        setIsSigningIn(false);
      } else if (result?.ok) {
        // Success - redirect will happen via useEffect
        setError(null);
      }
    } catch (error) {
      console.error("Sign in error:", error);

      // User-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          setError("Signature request was cancelled. Please try again.");
        } else if (error.message.includes("not connected")) {
          setError("Wallet disconnected. Please reconnect and try again.");
        } else {
          setError(`Sign in failed: ${error.message}`);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }

      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] relative overflow-hidden flex items-center justify-center">
      <Image
        src="/ellipse-1.png"
        alt="Ellipse Decoration One"
        width={500}
        height={500}
        className="z-10 absolute bottom-0 left-0"
      />
      <Image
        src="/ellipse-2.png"
        alt="Ellipse Decoration Two"
        width={500}
        height={400}
        className="z-10 absolute bottom-0 right-0"
      />

      {/* Main content */}
      <div className="relative z-10 text-center px-4 grid gap-9">
        <div className="">
          <h1 className="text-[56px] font-medium text-white mb-3 leading-snug">
            {!connected
              ? "Connect Your Wallet"
              : !session
              ? "Sign In"
              : "Redirecting..."}
          </h1>

          <p className="text-gray-400 text-base">
            {!connected
              ? "Connect your solana wallet address to continue"
              : "Verify your identity with your signature"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {connected && !session ? (
          <div className="flex items-center gap-4 w-[360px]">
            <span className="font-mono bg-[#202020] text-white text-[18px] font-medium py-3.5 px-8 rounded-2xl transition-all duration-200 h-[54px] flex-1 flex gap-2 items-center justify-center">
              <Image
                src="/solana.png"
                alt="Solana Logo"
                width={30}
                height={30}
                className="rounded-full"
              />
              {publicKey
                ? (() => {
                    const pk = publicKey.toBase58();
                    return `${pk.slice(0, 9)}...${pk.slice(-4)}`;
                  })()
                : ""}
            </span>
            <button
              onClick={() => {
                disconnect();
              }}
              aria-label="Disconnect wallet"
              className="font-mono bg-[#202020] text-white text-[18px] font-medium p-5 rounded-2xl transition-all duration-200 h-[54px] w-fit flex items-center justify-center hover:bg-red-600"
            >
              <Link className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        ) : null}
        {/* Custom styled wallet button */}
        <div className="flex justify-center">
          <div className="group relative">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#202020] rounded-tl-[12px] group-hover:-left-3 group-hover:-top-3 group-hover:border-white transition-all duration-500" />

            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#202020] rounded-tr-[12px] group-hover:-right-3 group-hover:-top-3 group-hover:border-white transition-all duration-500" />

            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#202020] rounded-bl-[12px] group-hover:-left-3 group-hover:-bottom-3 group-hover:border-white transition-all duration-500" />

            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#202020] rounded-br-[12px] group-hover:-right-3 group-hover:-bottom-3 group-hover:border-white transition-all duration-500" />

            <div className=" relative width-fit overflow-hidden">
              <Image
                src="/solflare.svg"
                alt="Solflare Logo"
                width={45}
                height={45}
                className="rounded-full z-20 absolute -top-14 -left-6 group-hover:left-0 group-hover:-top-2 transition-all duration-500 -rotate-12"
              />
              <Image
                src="/phantom.svg"
                alt="Phantom Logo"
                width={45}
                height={45}
                className="z-10 absolute -bottom-14 -left-0 group-hover:left-8 group-hover:-bottom-2 transition-all duration-500"
              />
              <Image
                src="/phantom.svg"
                alt="Phantom Logo"
                width={45}
                height={45}
                className="z-20 absolute -top-14 -right-6 group-hover:right-0 group-hover:-top-2 transition-all duration-500 rotate-12"
              />
              <Image
                src="/solflare.svg"
                alt="Solflare Logo"
                width={45}
                height={45}
                className="rounded-full z-10 absolute -bottom-14 -right-0 group-hover:right-8 group-hover:-bottom-2 transition-all duration-500"
              />

              {!connected ? (
                <WalletMultiButton
                  style={{
                    backgroundColor: "#202020",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "500",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    border: "none",
                    transition: "all 0.2s",
                    height: "54px",
                    width: "360px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              ) : !session ? (
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  style={{
                    backgroundColor: "#202020",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "500",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    border: "none",
                    transition: "all 0.2s",
                    height: "54px",
                    width: "360px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isSigningIn ? "not-allowed" : "pointer",
                    opacity: isSigningIn ? 0.6 : 1,
                  }}
                >
                  {isSigningIn ? "Signing In..." : "Sign In"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
