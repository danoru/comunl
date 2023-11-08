import { connectDatabase, updateDocument } from "../../../src/helpers/db-util";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;

  const id = req.body.id;
  const isGuestOnly = req.body.isGuestOnly;
  const isFeatured = req.body.isFeatured;

  try {
    client = await connectDatabase();
  } catch (error) {
    res.status(500).json({ message: "Connecting to the database failed." });
    return;
  }
  if (req.method === "PUT") {
    try {
      if (isGuestOnly) {
        await updateDocument(
          client,
          "events",
          { id: id },
          { $set: { isGuestOnly: isGuestOnly } }
        );
        client.close();
      } else if (isFeatured) {
        await updateDocument(
          client,
          "events",
          { id: id },
          { $set: { isFeatured: isFeatured } }
        );
        client.close();
      }
    } catch (error) {
      res.status(500).json({ message: "Updating data failed." });
      return;
    }
    res.status(201).json({ message: "Item updated successfully." });
    return;
  } else {
    res.status(400).json({ message: "Invalid request method." });
  }
  client.close();
}

export default handler;
