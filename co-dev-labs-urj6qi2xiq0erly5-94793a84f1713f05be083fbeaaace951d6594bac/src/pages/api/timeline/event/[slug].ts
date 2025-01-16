import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { createClient } from "@/util/supabase/api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "Invalid event identifier" })
  }

  try {
    console.log(`[API] 🔍 Fetching event with slug: ${slug}`, {
      timestamp: new Date().toISOString(),
      method: req.method
    })
    
    // Try to find event by slug, including all necessary relations
    const event = await prisma.event.findFirst({
      where: {
        slug: {
          equals: slug,
          not: null
        }
      },
      include: {
        timeline: {
          include: {
            posts: {
              where: {
                isApproved: true
              },
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
        }
      }
    })

    console.log(`[API] Event lookup result:`, {
      eventExists: !!event,
      hasTimeline: !!event?.timeline,
      slug: slug,
      postsCount: event?.timeline?.posts?.length ?? 0
    })

    if (!event) {
      console.log(`[API] Event not found for slug: ${slug}`)
      return res.status(404).json({ error: "Event not found" })
    }

    const timeline = event.timeline

    if (!timeline) {
      console.log(`[API] Timeline not found for event:`, event.id)
      return res.status(404).json({ error: "Timeline not found" })
    }

    // Check if timeline is active
    if (!timeline.isActive) {
      console.log(`[API] Timeline is not active for event:`, event.id)
      return res.status(403).json({ error: "Timeline is not active" })
    }

    // Get authenticated user if available (for post filtering)
    const supabase = createClient(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    const isEventCreator = user && event.userId === user.id

    // If user is event creator, fetch all posts including unapproved ones
    let posts = timeline.posts
    if (isEventCreator) {
      posts = await prisma.timelinePost.findMany({
        where: {
          timelineId: timeline.id
        },
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
      })
    }

    console.log(`[API] Returning timeline:`, {
      totalPosts: posts.length,
      isEventCreator
    })

    return res.status(200).json({
      ...timeline,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        userId: event.userId
      },
      posts: posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error("[API] Error fetching timeline:", error)
    return res.status(500).json({ 
      error: "Failed to fetch timeline",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}