import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SigninMessage } from "../../../../../utils/sign-in";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Solana",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
      },

      async authorize(credentials, req) {
        try {
          const signinMessage = new SigninMessage(
            JSON.parse(credentials?.message || "{}")
          );

          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);
          if (signinMessage.domain !== nextAuthUrl.host) {
            return null;
          }

          const csrfToken = await getCsrfToken({ req: { ...req, body: null } });

          if (signinMessage.nonce !== csrfToken) {
            return null;
          }

          // Verify the signature
          const isValid = await signinMessage.validate(credentials?.signature!);

          if (!isValid) {
            throw new Error("Could not validate the signed message");
          }

          // Verify the signer is the facilitator's wallet
          const backendUrl = process.env.BACKEND_URL || "http://localhost:3002";
          try {
            const publicKeysResponse = await fetch(
              `${backendUrl}/facilitator/public-keys`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (!publicKeysResponse.ok) {
              console.error(
                `Backend error: ${publicKeysResponse.status} ${publicKeysResponse.statusText}`
              );
              throw new Error(
                `Backend server error: ${publicKeysResponse.status}`
              );
            }

            const data = await publicKeysResponse.json();
            const { solanaPublicKey } = data;

            if (!solanaPublicKey) {
              console.error("Backend did not return a Solana public key");
              throw new Error("Invalid backend response");
            }

            if (signinMessage.publicKey !== solanaPublicKey) {
              console.error(
                `Wallet mismatch: ${signinMessage.publicKey} !== ${solanaPublicKey}`
              );
              throw new Error(
                "Unauthorized: Only the facilitator wallet can access the dashboard"
              );
            }
          } catch (error) {
            console.error("Failed to verify facilitator wallet:", error);
            if (error instanceof Error) {
              console.error("Error details:", error.message);
            }
            return null;
          }

          // Return whatever data you want in the session
          return {
            id: signinMessage.publicKey,
            walletAddress: signinMessage.publicKey,
            signedAt: new Date().toISOString(),
          };
        } catch (e) {
          console.log(e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for sessions
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // Add custom data from token to session
      session.user = {
        walletAddress: token.walletAddress,
        image: `https://ui-avatars.com/api/?name=${token.walletAddress}&background=random`,
        signedAt: token.signedAt,
      };
      return session;
    },
    async jwt({ token, user }) {
      // When user signs in, add custom data to token
      if (user) {
        token.publicKey = user.walletAddress;
        token.walletAddress = user.walletAddress;
        token.signedAt = user.signedAt;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
