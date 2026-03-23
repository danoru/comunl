import type { NextApiRequest, NextApiResponse } from "next";
import { getEvents, createEvent } from "../../../src/lib/db";
import { getSiteConfig, CreateEventSchema } from "../../../src/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const events = await getEvents(tenantId);
    return res.status(200).json(events);
  }

  if (req.method === "POST") {
    const result = CreateEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    // Generate a simple event id from title + timestamp
    const id =
      result.data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 20) +
      "-" +
      Date.now().toString(36);

    const event = await createEvent(tenantId, { ...result.data, id });
    return res.status(201).json(event);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
