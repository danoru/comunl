import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getItems, addItem } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

const RSVPSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const guests = await getItems(tenantId, eventId, {
      itemType: "guest",
    } as any);
    // Legacy shape kept for compatibility: { attendance: [...] }
    return res.status(200).json({ attendance: guests });
  }

  if (req.method === "POST") {
    const result = RSVPSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email } = result.data;
    const entry = await addItem(tenantId, eventId, {
      itemType: "guest",
      item: name,
      ...(email ? { submittedBy: email } : {}),
    });

    return res.status(201).json({ entry });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
