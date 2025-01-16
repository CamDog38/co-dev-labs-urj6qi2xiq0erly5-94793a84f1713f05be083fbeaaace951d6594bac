import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { createClient } from "@/util/supabase/api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "PATCH", "PUT"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { id } = req.query

  try {
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid event ID" })
    }

    const event = await prisma.event.findUnique({
      where: { id: id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        type: true,
        userId: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // For authenticated users, we need to check their permissions
    const supabase = createClient(req, res)
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user has access to this event
    if (!user || user.id !== event.userId) {
      const userAccess = await prisma.eventAccess.findFirst({
        where: {
          eventId: event.id,
          userId: user?.id
        }
      })

      if (!userAccess) {
        return res.status(403).json({ error: "Access denied" })
      }
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const { name, description, startDate, endDate, location, type } = req.body;
      
      try {
        const updatedEvent = await prisma.event.update({
          where: { id },
          data: {
            ...(name && { title: name }), // Map 'name' to 'title'
            ...(description && { description }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            ...(location && { location }),
            ...(type && { type })
          },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            type: true,
            userId: true
          }
        });

        // Map the response to match the expected format
        const response = {
          ...updatedEvent,
          name: updatedEvent.title // Map 'title' back to 'name' in response
        };
        delete response.title;

        return res.status(200).json(response);
      } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ error: "Failed to update event" });
      }
    }

    // Map the response to match the expected format for GET
    const response = {
      ...event,
      name: event.title
    };
    delete response.title;

    return res.status(200).json(response)
  } catch (error) {
    console.error("Error handling event:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}