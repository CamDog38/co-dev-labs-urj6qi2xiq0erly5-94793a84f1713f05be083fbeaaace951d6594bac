import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId, postId } = req.query;
  const supabase = createClient(req, res);
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is event admin
  const event = await prisma.event.findUnique({
    where: { id: eventId as string },
    include: { organizer: true },
  });

  if (!event || event.organizerId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'PUT') {
    try {
      const { action } = req.body;

      const timeline = await prisma.raceTimeline.findUnique({
        where: { eventId: eventId as string },
      });

      if (!timeline) {
        return res.status(404).json({ error: 'Timeline not found' });
      }

      const post = await prisma.timelinePost.update({
        where: { id: postId as string },
        data: {
          isApproved: action === 'approve',
        },
      });

      return res.status(200).json(post);
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}