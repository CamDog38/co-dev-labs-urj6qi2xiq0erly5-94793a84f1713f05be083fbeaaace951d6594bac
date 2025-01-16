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
      const results = await prisma.eventResult.findMany({
        where: {
          eventId: id as string,
        },
        orderBy: {
          dateRange: "desc",
        },
      });
      return res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      return res.status(500).json({ error: "Error fetching results" });
    }
  }

  if (req.method === "POST") {
    try {
      const { results } = req.body;

      // Delete existing results
      await prisma.eventResult.deleteMany({
        where: {
          eventId: id as string,
        },
      });

      // Create new results
      const createdResults = await prisma.eventResult.createMany({
        data: results.map((result: any) => ({
          eventId: id as string,
          dateRange: result.dateRange,
          documentUrl: result.documentUrl,
          documentName: result.documentName || "Results Document",
          boatClass: result.boatClass || null,
        })),
      });

      return res.status(200).json(createdResults);
    } catch (error) {
      console.error("Error saving results:", error);
      return res.status(500).json({ error: "Error saving results" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}