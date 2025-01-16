import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { createClient } from "@/util/supabase/api"

const DEFAULT_SETTINGS = {
  isActive: false,
  requireApproval: true,
  allowPublicViewing: false,
  allowParticipantPosting: true
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query
  
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: "Invalid event ID" })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (req.method === "GET") {
    try {
      const timeline = await prisma.raceTimeline.findUnique({
        where: { eventId: eventId },
        select: {
          isActive: true,
          requireApproval: true,
          allowPublicViewing: true,
          allowParticipantPosting: true
        }
      })

      // If timeline doesn't exist, return default settings
      return res.status(200).json(timeline || DEFAULT_SETTINGS)
    } catch (error) {
      console.error("Error fetching timeline settings:", error)
      return res.status(500).json({ error: "Failed to fetch timeline settings" })
    }
  }

  if (req.method === "PUT") {
    const { isActive, requireApproval, allowPublicViewing, allowParticipantPosting } = req.body

    try {
      // Check if user is event owner
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { userId: true }
      })

      if (!event || event.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // Update or create timeline with all settings
      const timeline = await prisma.raceTimeline.upsert({
        where: { eventId: eventId },
        update: {
          isActive: isActive ?? DEFAULT_SETTINGS.isActive,
          requireApproval: requireApproval ?? DEFAULT_SETTINGS.requireApproval,
          allowPublicViewing: allowPublicViewing ?? DEFAULT_SETTINGS.allowPublicViewing,
          allowParticipantPosting: allowParticipantPosting ?? DEFAULT_SETTINGS.allowParticipantPosting
        },
        create: {
          eventId: eventId,
          isActive: isActive ?? DEFAULT_SETTINGS.isActive,
          requireApproval: requireApproval ?? DEFAULT_SETTINGS.requireApproval,
          allowPublicViewing: allowPublicViewing ?? DEFAULT_SETTINGS.allowPublicViewing,
          allowParticipantPosting: allowParticipantPosting ?? DEFAULT_SETTINGS.allowParticipantPosting
        },
        select: {
          isActive: true,
          requireApproval: true,
          allowPublicViewing: true,
          allowParticipantPosting: true
        }
      })

      return res.status(200).json(timeline)
    } catch (error) {
      console.error("Error updating timeline settings:", error)
      return res.status(500).json({ error: "Failed to update timeline settings" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}