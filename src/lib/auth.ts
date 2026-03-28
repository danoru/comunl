import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export async function getSession(context: GetServerSidePropsContext) {
  return getServerSession(context.req, context.res, authOptions);
}

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
