import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { createClient } from '@/util/supabase/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[Likes API] ${req.method} request for post ${req.query.postId}`);

  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    console.log('[Likes API] Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { eventId, postId } = req.query
  if (!eventId || !postId) {
    console.error('[Likes API] Missing required parameters:', { eventId, postId });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const supabase = createClient(req, res)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('[Likes API] Auth error:', authError);
  }

  // Only require authentication for POST and DELETE
  if (!user && (req.method === 'POST' || req.method === 'DELETE')) {
    console.log('[Likes API] Unauthorized attempt to', req.method);
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      // Get total likes count and check if user liked the post
      const [likesCount, userLike] = await Promise.all([
        prisma.timelinePostLike.count({
          where: { postId: postId as string },
        }),
        prisma.timelinePostLike.findUnique({
          where: {
            postId_userId: {
              postId: postId as string,
              userId: user.id,
            },
          },
        }),
      ]);

      return res.status(200).json({
        count: likesCount,
        userLiked: !!userLike,
      });
    } else if (req.method === 'POST') {
      const like = await prisma.timelinePostLike.create({
        data: {
          postId: postId as string,
          userId: user.id,
        },
      })
      return res.status(200).json(like)
    } else if (req.method === 'DELETE') {
      await prisma.timelinePostLike.delete({
        where: {
          postId_userId: {
            postId: postId as string,
            userId: user.id,
          },
        },
      })
      return res.status(200).json({ message: 'Like removed' })
    }
  } catch (error) {
    console.error('Error handling like:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}