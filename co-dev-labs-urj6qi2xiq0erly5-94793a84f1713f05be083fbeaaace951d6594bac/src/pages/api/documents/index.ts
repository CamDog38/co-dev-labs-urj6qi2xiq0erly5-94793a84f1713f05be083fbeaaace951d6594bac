import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabase = createClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { eventId, seriesId } = req.query;

  try {
    let whereClause: any = {
      userId: user.id,
    };

    if (eventId && typeof eventId === "string") {
      // Get the event to find its series
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { seriesId: true }
      });

      whereClause.OR = [
        { eventId },
        { seriesId: event?.seriesId }
      ];
    } else if (seriesId && typeof seriesId === "string") {
      whereClause.seriesId = seriesId;
    }

    // Get documents based on the constructed where clause
    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ message: "Error fetching documents" });
  }
}