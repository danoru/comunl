// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { upsertUser } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // All Google accounts can sign in — admin check happens separately
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert user record in DB on every sign-in to keep profile fresh
      try {
        const { tenantId } = getSiteConfig();
        await upsertUser({
          userId: account!.providerAccountId,
          tenantId,
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          image: user.image ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.error("[auth] Failed to upsert user:", e);
        // Don't block sign-in if DB write fails
      }

      return true;
    },

    async jwt({ token, account, user }) {
      // Persist the Google account ID on the JWT so we can use it as userId
      if (account) {
        token.userId = account.providerAccountId;
        token.isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).userId = token.userId;
      (session as any).isAdmin = token.isAdmin ?? false;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
