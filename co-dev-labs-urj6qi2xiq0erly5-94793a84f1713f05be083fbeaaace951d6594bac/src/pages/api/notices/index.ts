import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { createClient } from "@/util/supabase/api"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { eventId } = req.query

  if (!eventId || typeof eventId !== "string") {
    return res.status(400).json({ error: "Event ID is required" })
  }

  try {
    const notices = await prisma.notice.findMany({
      where: {
        eventId: eventId,
      },
      orderBy: {
        sequence: "asc",
      },
    })

    return res.status(200).json(notices)
  } catch (error) {
    console.error("Error fetching notices:", error)
    return res.status(500).json({ error: "Failed to fetch notices" })
  }
}