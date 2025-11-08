import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      walletAddress: string;
      image: string;
      signedAt: string;
    };
  }

  interface User {
    id: string;
    walletAddress: string;
    signedAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    walletAddress: string;
    publicKey: string;
    signedAt: string;
  }
}
