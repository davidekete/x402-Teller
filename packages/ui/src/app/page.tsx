"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
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

  // Effect: Redirect when authenticated
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
            Sign In
          </h1>

          <p className="text-gray-400 text-base">
            Connect your solana wallet address to continue
          </p>
        </div>

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
                    cursor: "pointer",
                  }}
                >
                  Sign In
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
