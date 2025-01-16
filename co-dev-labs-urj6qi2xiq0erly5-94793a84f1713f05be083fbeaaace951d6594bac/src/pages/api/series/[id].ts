import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const supabase = createClient(req, res);

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const series = await prisma.series.findUnique({
        where: { id: id as string },
        include: {
          events: true,
        },
      });

      if (!series) {
        return res.status(404).json({ error: 'Series not found' });
      }

      return res.status(200).json(series);
    } catch (error) {
      console.error('Error fetching series:', error);
      return res.status(500).json({ error: 'Failed to fetch series' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { title, description } = req.body;
      
      // First update the series
      const updatedSeries = await prisma.series.update({
        where: { id: id as string },
        data: {
          title,
          description,
        },
      });

      // Get all events for this series ordered by start date
      const events = await prisma.event.findMany({
        where: {
          seriesId: id as string,
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      // Update each event while maintaining its number
      for (let i = 0; i < events.length; i++) {
        await prisma.event.update({
          where: {
            id: events[i].id,
          },
          data: {
            title: `${title} - Event ${i + 1}`,
          },
        });
      };

      // Fetch the final result with all events
      const finalResult = await prisma.series.findUnique({
        where: { id: id as string },
        include: {
          events: {
            orderBy: {
              startDate: 'asc',
            },
          },
        },
      });

      return res.status(200).json(finalResult);
    } catch (error) {
      console.error('Error updating series:', error);
      return res.status(500).json({ error: 'Failed to update series' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First delete all events in the series
      await prisma.event.deleteMany({
        where: { seriesId: id as string },
      });

      // Then delete the series itself
      await prisma.series.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ message: 'Series and all associated events deleted successfully' });
    } catch (error) {
      console.error('Error deleting series:', error);
      return res.status(500).json({ error: 'Failed to delete series' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}