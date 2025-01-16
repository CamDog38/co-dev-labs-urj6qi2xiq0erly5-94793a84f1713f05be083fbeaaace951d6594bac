import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { createClient } from '@/util/supabase/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[Comments API] ${req.method} request for post ${req.query.postId}`);

  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log('[Comments API] Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { eventId, postId } = req.query
  if (!eventId || !postId) {
    console.error('[Comments API] Missing required parameters:', { eventId, postId });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const supabase = createClient(req, res)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('[Comments API] Auth error:', authError);
  }

  // Only require authentication for POST
  if (!user && req.method === 'POST') {
    console.log('[Comments API] Unauthorized attempt to post comment');
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const comments = await prisma.timelinePostComment.findMany({
        where: {
          postId: postId as string,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return res.status(200).json(comments)
    } else {
      const { content } = req.body
      if (!content) {
        return res.status(400).json({ message: 'Comment content is required' })
      }

      const comment = await prisma.timelinePostComment.create({
        data: {
          content,
          postId: postId as string,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      })
      return res.status(200).json(comment)
    }
  } catch (error) {
    console.error('Error handling comment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}