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

  const { id } = req.query

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Notice ID is required" })
  }

  if (req.method === "DELETE") {
    try {
      await prisma.notice.delete({
        where: { id },
      })

      return res.status(200).json({ message: "Notice deleted successfully" })
    } catch (error) {
      console.error("Error deleting notice:", error)
      return res.status(500).json({ error: "Failed to delete notice" })
    }
  }

  if (req.method === "PUT") {
    try {
      const { sequence } = req.body
      
      if (typeof sequence !== 'number') {
        return res.status(400).json({ error: "Sequence must be a number" })
      }

      const updatedNotice = await prisma.notice.update({
        where: { id },
        data: { sequence },
      })

      return res.status(200).json(updatedNotice)
    } catch (error) {
      console.error("Error updating notice:", error)
      return res.status(500).json({ error: "Failed to update notice" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}