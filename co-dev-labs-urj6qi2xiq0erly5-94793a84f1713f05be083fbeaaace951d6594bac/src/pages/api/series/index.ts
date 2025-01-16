import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      const series = await prisma.series.findMany({
        where: {
          userId: user.id
        },
        include: {
          events: {
            orderBy: {
              startDate: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(series);
    } catch (error) {
      console.error('Error fetching series:', error);
      return res.status(500).json({ error: 'Failed to fetch series' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description } = req.body;

      const newSeries = await prisma.series.create({
        data: {
          title,
          description,
          userId: user.id,
        },
        include: {
          events: true,
        },
      });

      return res.status(201).json(newSeries);
    } catch (error) {
      console.error('Error creating series:', error);
      return res.status(500).json({ error: 'Failed to create series' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}