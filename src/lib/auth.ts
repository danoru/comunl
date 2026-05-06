import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";

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

export interface ApiAuthInfo {
  userId: string;
  isAdmin: boolean;
}

export async function requireApiSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ApiAuthInfo | null> {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;
  if (!session || !userId) {
    res.status(401).json({ message: "Not signed in" });
    return null;
  }
  return { userId, isAdmin: (session as any).isAdmin ?? false };
}

export async function requireEventEditor(
  req: NextApiRequest,
  res: NextApiResponse,
  event: { createdBy?: string; hosts?: string[] }
): Promise<ApiAuthInfo | null> {
  const auth = await requireApiSession(req, res);
  if (!auth) return null;

  const isCreator = !!event.createdBy && event.createdBy === auth.userId;
  const isHost = (event.hosts ?? []).includes(auth.userId);

  if (!auth.isAdmin && !isCreator && !isHost) {
    res.status(403).json({ message: "Not authorized to edit this event" });
    return null;
  }
  return auth;
}
