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
              `${backendUrl}/facilitator/public-keys`
            );
            const { solanaPublicKey } = await publicKeysResponse.json();

            if (signinMessage.publicKey !== solanaPublicKey) {
              throw new Error(
                "Unauthorized: Only the facilitator wallet can access the dashboard"
              );
            }
          } catch (error) {
            console.error("Failed to verify facilitator wallet:", error);
            return null;
          }

          // Return whatever data you want in the session
          return {
            id: signinMessage.publicKey,
            walletAddress: signinMessage.publicKey,
            signedAt: new Date().toISOString(),
          };
        } catch (e) {
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
    // THIS IS WHERE YOU CONTROL WHAT GOES INTO THE SESSION
    async session({ session, token }) {
      // Add custom data from token to session
      session.user = {
        //@ts-ignore
        walletAddress: token.walletAddress as string,
        image: `https://ui-avatars.com/api/?name=${token.walletAddress}&background=random`,
        signedAt: token.signedAt as string,
      };
      return session;
    },
    async jwt({ token, user }) {
      // When user signs in, add custom data to token
      if (user) {
        // @ts-ignore
        token.publicKey = user.walletAddress;
        // @ts-ignore
        token.walletAddress = user.walletAddress;
        // @ts-ignore
        token.signedAt = user.signedAt;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
