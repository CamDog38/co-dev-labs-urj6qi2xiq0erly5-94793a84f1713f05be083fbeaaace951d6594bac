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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { notices } = req.body

  if (!notices || !Array.isArray(notices)) {
    return res.status(400).json({ error: "Invalid notices data" })
  }

  try {
    await prisma.$transaction(
      notices.map((notice) =>
        prisma.notice.update({
          where: { id: notice.id },
          data: { sequence: notice.sequence },
        })
      )
    )

    return res.status(200).json({ message: "Notices reordered successfully" })
  } catch (error) {
    console.error("Error reordering notices:", error)
    return res.status(500).json({ error: "Failed to reorder notices" })
  }
}