// Helper to protect admin pages server-side.
//
// Usage in getServerSideProps:
//   const session = await requireAdmin(context);
//   if (!session) return; // redirect already set

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

/**
 * Call at the top of any admin getServerSideProps.
 * Returns the session if the user is an admin.
 * Returns null and sets a redirect to /auth/signin if not.
 */
export async function requireAdmin(
  context: GetServerSidePropsContext
): Promise<{ session: any } | null> {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !(session as any).isAdmin) {
    (context.res as any).__nextAuth = {
      redirect: {
        destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
    return null;
  }

  return { session };
}

/**
 * Convenience wrapper that returns a Next.js redirect object directly.
 * Use this in getServerSideProps when you want to return early:
 *
 *   const guard = await adminGuard(context);
 *   if (guard) return guard;
 */
export async function adminGuard(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<any> | null> {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !(session as any).isAdmin) {
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  return null;
}
