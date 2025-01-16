import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { createClient } from "@/util/supabase/api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query
  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return res.status(401).json({ error: "Authentication required" })
  }

  if (req.method === "GET") {
    try {
      const timeline = await prisma.raceTimeline.findUnique({
        where: { eventId: String(eventId) },
        include: {
          event: {
            select: {
              title: true,
              description: true,
              userId: true
            }
          },
          posts: {
            include: {
              author: {
                select: {
                  username: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      })

      if (!timeline) {
        return res.status(404).json({ error: "Timeline not found" })
      }

      // Check if timeline is active
      if (!timeline.isActive) {
        return res.status(403).json({ error: "Timeline is not active" })
      }

      // Filter posts based on approval status and user permissions
      const isEventCreator = user.id === timeline.event.userId
      const filteredPosts = timeline.posts.filter(post => 
        post.isApproved || isEventCreator
      )

      return res.status(200).json({
        ...timeline,
        posts: filteredPosts
      })
    } catch (error) {
      console.error("Error fetching timeline:", error)
      return res.status(500).json({ error: "Failed to fetch timeline" })
    }
  }

  if (req.method === "POST") {
    try {
      const timeline = await prisma.raceTimeline.findUnique({
        where: { eventId: String(eventId) },
        include: {
          event: true
        }
      })

      if (!timeline) {
        return res.status(404).json({ error: "Timeline not found" })
      }

      // Check if timeline is active
      if (!timeline.isActive) {
        return res.status(403).json({ error: "Timeline is not active" })
      }

      // Check if participant posting is allowed
      if (!timeline.allowParticipantPosting) {
        return res.status(403).json({ error: "Posting is not allowed in this timeline" })
      }

      const { content, mediaUrl, mediaType } = req.body

      const post = await prisma.timelinePost.create({
        data: {
          content,
          mediaUrl,
          mediaType,
          timelineId: timeline.id,
          userId: user.id,
          isApproved: !timeline.requireApproval || timeline.event.userId === user.id, // Auto-approve if approval not required or user is event creator
        },
        include: {
          author: {
            select: {
              username: true,
              role: true
            }
          }
        }
      })

      return res.status(201).json({
        ...post,
        createdAt: post.createdAt.toISOString()
      })
    } catch (error) {
      console.error("Error creating post:", error)
      return res.status(500).json({ error: "Failed to create post" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}