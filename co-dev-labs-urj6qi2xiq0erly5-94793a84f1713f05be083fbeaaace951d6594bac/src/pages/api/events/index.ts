import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;

    // Handle public access via username
    if (username) {
      const user = await prisma.user.findFirst({
        where: { username: username as string },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const events = await prisma.event.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          startDate: 'asc',
        },
        include: {
          documents: {
            orderBy: {
              order: 'asc',
            },
            select: {
              id: true,
              name: true,
              url: true,
              order: true,
              type: true,
            }
          },
          notices: {
            orderBy: {
              sequence: 'asc',
            },
            select: {
              id: true,
              subject: true,
              content: true,
              sequence: true,
            }
          },
          series: {
            select: {
              id: true,
              title: true,
            }
          },
        },
      });

      const transformedEvents = events.map(event => ({
        ...event,
        seriesName: event.series?.title || null,
        series: event.series ? {
          id: event.series.id,
          name: event.series.title,
        } : null
      }));

      // Set cache headers for public data
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).json(transformedEvents);
    }

    // Handle authenticated access
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        startDate: 'asc',
      },
      include: {
        documents: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            name: true,
            url: true,
            order: true,
            type: true,
          }
        },
        notices: {
          orderBy: {
            sequence: 'asc',
          },
          select: {
            id: true,
            subject: true,
            content: true,
            sequence: true,
          }
        },
        series: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    const transformedEvents = events.map(event => ({
      ...event,
      seriesName: event.series?.title || null,
      series: event.series ? {
        id: event.series.id,
        name: event.series.title,
      } : null
    }));

    // Set cache headers for authenticated data
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return res.status(200).json(transformedEvents);
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}