import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;
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

  if (req.method === 'POST') {
    try {
      const { email, role } = req.body;

      // Find or create user
      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get or create timeline
      const timeline = await prisma.raceTimeline.upsert({
        where: { eventId: eventId as string },
        update: {},
        create: {
          eventId: eventId as string,
          isActive: true,
        },
      });

      // Add user access
      const access = await prisma.timelineAccess.create({
        where: {
          timelineId_userId: {
            timelineId: timeline.id,
            userId: targetUser.id,
          },
        },
        update: { role: role.toUpperCase() },
        create: {
          timelineId: timeline.id,
          userId: targetUser.id,
          role: role.toUpperCase(),
        },
      });

      return res.status(200).json({
        id: targetUser.id,
        username: targetUser.username,
        role: access.role.toLowerCase(),
      });
    } catch (error) {
      console.error('Error adding timeline user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { userId } = req.query;

    try {
      const timeline = await prisma.raceTimeline.findUnique({
        where: { eventId: eventId as string },
      });

      if (!timeline) {
        return res.status(404).json({ error: 'Timeline not found' });
      }

      await prisma.timelineAccess.delete({
        where: {
          timelineId_userId: {
            timelineId: timeline.id,
            userId: userId as string,
          },
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing timeline user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}