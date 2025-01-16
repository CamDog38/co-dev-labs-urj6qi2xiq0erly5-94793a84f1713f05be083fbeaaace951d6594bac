import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  const username = decodeURIComponent(req.query.username as string);

  if (!username) {
    return res.status(400).json({
      message: 'Username is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // First get the user ID if username is provided
    const user = await prisma.user.findFirst({
      where: { 
        username: username as string,
        NOT: {
          status: 'DELETED'
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        timestamp: new Date().toISOString(),
        requestedUsername: username
      });
    }

    // Get the date range for events
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Include events from last month
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Include events up to a year ahead

    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        AND: [
          {
            startDate: {
              gte: startDate
            }
          },
          {
            startDate: {
              lte: endDate
            }
          }
        ]
      },
      orderBy: {
        startDate: 'asc',
      },
      include: {
        documents: {
          orderBy: {
            order: 'asc',
          },
        },
        notices: {
          orderBy: {
            sequence: 'asc',
          },
        },
        series: true,
      },
    });

    const transformedEvents = events.map(event => ({
      ...event,
      seriesName: event.series?.name || null,
      series: event.series ? {
        id: event.series.id,
        name: event.series.name,
      } : null
    }));

    return res.status(200).json(transformedEvents);
  } catch (error) {
    console.error('Error in public events API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: '/api/events/public'
    });
  } finally {
    await prisma.$disconnect();
  }
}