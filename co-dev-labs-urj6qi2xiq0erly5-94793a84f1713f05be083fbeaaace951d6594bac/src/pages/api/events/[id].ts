import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const supabase = createClient(req, res);

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const event = await prisma.event.findUnique({
        where: { id: String(id) },
        include: {
          documents: true,
          series: {
            include: {
              documents: true,
            },
          },
          notices: {
            include: {
              createdBy: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      // Combine event documents with series documents
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const combinedDocuments = [
        ...(event?.documents || []),
        ...(event?.series?.documents?.map(doc => ({
          ...doc,
          seriesId: event.series?.id,
          isSeriesDocument: true,
          name: `[Series] ${doc.name}`
        })) || [])
      ];

      return res.status(200).json({
        ...event,
        documents: combinedDocuments
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      return res.status(500).json({ error: "Error fetching event" });
    }
  } else if (req.method === "PUT") {
    try {
      const { title, type, location, startDate, endDate, classes } = req.body;

      const updatedEvent = await prisma.event.update({
        where: { id: String(id) },
        data: {
          title,
          type,
          location,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          classes: classes || [],
        },
      });

      return res.status(200).json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      return res.status(500).json({ error: "Error updating event" });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.event.delete({
        where: { id: String(id) },
      });

      return res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      return res.status(500).json({ error: "Error deleting event" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}