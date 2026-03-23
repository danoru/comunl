import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    // Block sign-in if email isn't in the allowlist
    async signIn({ user }) {
      const email = user.email?.toLowerCase() ?? "";
      if (!ADMIN_EMAILS.includes(email)) {
        // Returning false redirects to /api/auth/error?error=AccessDenied
        return false;
      }
      return true;
    },

    // Expose isAdmin on the session so components can check it
    async session({ session }) {
      const email = session.user?.email?.toLowerCase() ?? "";
      (session as any).isAdmin = ADMIN_EMAILS.includes(email);
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
